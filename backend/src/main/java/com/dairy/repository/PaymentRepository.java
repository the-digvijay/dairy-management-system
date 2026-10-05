package com.dairy.repository;

import com.dairy.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository
        extends JpaRepository<Payment, Long> {

    List<Payment> findByFarmerIdAndBillMonthOrderByPaymentDateDescIdDesc(
        Long farmerId,
        String billMonth
    );

    Optional<Payment> findByRequestId(String requestId);

    boolean existsByFarmerId(Long farmerId);
}
