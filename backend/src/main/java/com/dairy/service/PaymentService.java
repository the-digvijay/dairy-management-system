package com.dairy.service;

import com.dairy.dto.PaymentInput;
import com.dairy.entity.Farmer;
import com.dairy.entity.Payment;
import com.dairy.repository.PaymentRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Objects;

@Service
@Transactional
public class PaymentService {

    private final PaymentRepository payments;
    private final DairyService dairy;
    private final EntityManager entityManager;

    public PaymentService(
        PaymentRepository payments,
        DairyService dairy,
        EntityManager entityManager
    ) {
        this.payments = payments;
        this.dairy = dairy;
        this.entityManager = entityManager;
    }

    // API response मध्ये पूर्ण bank details पाठवणार नाही.
    public record PaymentView(
        Long id,
        Long farmerId,
        String farmerName,
        String billMonth,
        BigDecimal amount,
        LocalDate paymentDate,
        String paymentMethod,
        String transactionReference,
        String notes,
        String requestId
    ) {}

    public record PaymentSummary(
        Long farmerId,
        String farmerName,
        String billMonth,
        BigDecimal billAmount,
        BigDecimal paidAmount,
        BigDecimal outstandingAmount,
        String status
    ) {}

    private String text(String value) {
        return value == null || value.isBlank()
            ? null
            : value.trim();
    }

    private String validMonth(String value) {
        try {
            if (value == null ||
                !value.matches("[0-9]{4}-(0[1-9]|1[0-2])")) {
                throw new IllegalArgumentException();
            }

            YearMonth month = YearMonth.parse(value);

            if (month.getYear() < 1) {
                throw new IllegalArgumentException();
            }

            return month.toString();
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Bill month must be YYYY-MM"
            );
        }
    }

    private Farmer findFarmer(Long farmerId, boolean lock) {
        if (farmerId == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Select a farmer"
            );
        }

        Farmer farmer = lock
            ? entityManager.find(
                Farmer.class,
                farmerId,
                LockModeType.PESSIMISTIC_WRITE
            )
            : entityManager.find(Farmer.class, farmerId);

        if (farmer == null) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Farmer not found"
            );
        }

        return farmer;
    }

    private PaymentView view(Payment payment) {
        return new PaymentView(
            payment.id,
            payment.farmer.id,
            payment.farmer.name,
            payment.billMonth,
            payment.amount,
            payment.paymentDate,
            payment.paymentMethod,
            payment.transactionReference,
            payment.notes,
            payment.requestId
        );
    }

    private PaymentSummary calculate(
        Farmer farmer,
        String month
    ) {
        BigDecimal billAmount = dairy.entries(month, farmer.id)
            .stream()
            .map(collection -> collection.amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP);

        BigDecimal paidAmount = payments
            .findByFarmerIdAndBillMonthOrderByPaymentDateDescIdDesc(
                farmer.id,
                month
            )
            .stream()
            .map(payment -> payment.amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP);

        BigDecimal outstanding = billAmount.subtract(paidAmount);

        String status;

        if (billAmount.signum() == 0 && paidAmount.signum() == 0) {
            status = "NO_COLLECTIONS";
        } else if (outstanding.signum() < 0) {
            status = "OVERPAID";
        } else if (outstanding.signum() == 0) {
            status = "PAID";
        } else if (paidAmount.signum() > 0) {
            status = "PARTIALLY_PAID";
        } else {
            status = "UNPAID";
        }

        return new PaymentSummary(
            farmer.id,
            farmer.name,
            month,
            billAmount,
            paidAmount,
            outstanding,
            status
        );
    }

    @Transactional(readOnly = true)
    public PaymentSummary summary(Long farmerId, String billMonth) {
        String month = validMonth(billMonth);
        return calculate(findFarmer(farmerId, false), month);
    }

    @Transactional(readOnly = true)
    public List<PaymentView> list(Long farmerId, String billMonth) {
        String month = validMonth(billMonth);
        findFarmer(farmerId, false);

        return payments
            .findByFarmerIdAndBillMonthOrderByPaymentDateDescIdDesc(
                farmerId,
                month
            )
            .stream()
            .map(this::view)
            .toList();
    }

    public PaymentView save(PaymentInput input) {
        String month = validMonth(input.billMonth());

        // त्याच शेतकऱ्याचे payments एकावेळी एकच save होतील.
        Farmer farmer = findFarmer(input.farmerId(), true);

        Payment existing = payments
            .findByRequestId(input.requestId())
            .orElse(null);

        if (existing != null) {
            boolean sameRequest =
                existing.farmer.id.equals(input.farmerId()) &&
                existing.billMonth.equals(month) &&
                existing.amount.compareTo(input.amount()) == 0 &&
                existing.paymentDate.equals(input.paymentDate()) &&
                existing.paymentMethod.equals(input.paymentMethod()) &&
                Objects.equals(
                    existing.transactionReference,
                    text(input.transactionReference())
                ) &&
                Objects.equals(existing.notes, text(input.notes()));

            if (!sameRequest) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Request ID already used for a different payment"
                );
            }

            return view(existing);
        }

        if (!"CASH".equals(input.paymentMethod()) &&
            text(input.transactionReference()) == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Enter transaction reference for bank transfer or UPI"
            );
        }

        PaymentSummary summary = calculate(farmer, month);

        if (input.amount().compareTo(
                summary.outstandingAmount()
            ) > 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Payment cannot exceed outstanding amount: " +
                summary.outstandingAmount()
            );
        }

        Payment payment = new Payment();
        payment.farmer = farmer;
        payment.billMonth = month;
        payment.amount = input.amount().setScale(
            2,
            RoundingMode.UNNECESSARY
        );
        payment.paymentDate = input.paymentDate();
        payment.paymentMethod = input.paymentMethod();
        payment.transactionReference =
            text(input.transactionReference());
        payment.notes = text(input.notes());
        payment.requestId = input.requestId();

        return view(payments.saveAndFlush(payment));
    }
}