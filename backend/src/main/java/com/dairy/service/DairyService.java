package com.dairy.service;

import com.dairy.entity.*;
import com.dairy.repository.*;
import com.dairy.dto.Requests.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.math.*;
import java.time.*;
import java.util.*;

@Service
@Transactional
public class DairyService {

    private final FarmerRepository farmers;
    private final MilkRateRepository rates;
    private final MilkCollectionRepository collections;

    public DairyService(
        FarmerRepository farmers,
        MilkRateRepository rates,
        MilkCollectionRepository collections
    ) {
        this.farmers = farmers;
        this.rates = rates;
        this.collections = collections;
    }

    public List<Farmer> listFarmers() {
        return farmers.findAll();
    }

    public List<MilkRate> listRates() {
        return rates.findAll();
    }

    private <T> T required(Optional<T> value) {
        return value.orElseThrow(() ->
            new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Record not found"
            )
        );
    }

    private String optionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    public Farmer farmer(Long id, FarmerInput input) {
        Farmer farmer = id == null
            ? new Farmer()
            : required(farmers.findById(id));

        farmer.name = input.name().trim();
        farmer.mobile = input.mobile();
        farmer.village = input.village().trim();

        farmer.accountHolderName =
            optionalText(input.accountHolderName());

        farmer.bankAccountNumber =
            optionalText(input.bankAccountNumber());

        String ifsc = optionalText(input.ifscCode());

        farmer.ifscCode = ifsc == null
            ? null
            : ifsc.toUpperCase(Locale.ROOT);

        return farmers.save(farmer);
    }

    public void deleteFarmer(Long id) {
        required(farmers.findById(id));

        if (collections.existsByFarmerId(id)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Farmer has collection history and cannot be deleted"
            );
        }

        farmers.deleteById(id);
    }

    public MilkRate rate(Long id, RateInput input) {
        MilkRate rate = id == null
            ? new MilkRate()
            : required(rates.findById(id));

        BigDecimal fat = decimal(input.fat());
        BigDecimal snf = decimal(input.snf());

        rates.findByMilkTypeAndFatAndSnf(
            input.milkType(),
            fat,
            snf
        ).ifPresent(existing -> {
            if (!existing.id.equals(id)) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This rate combination already exists"
                );
            }
        });

        rate.milkType = input.milkType();
        rate.fat = fat;
        rate.snf = snf;
        rate.rate = decimal(input.rate());

        return rates.save(rate);
    }

    public void deleteRate(Long id) {
        required(rates.findById(id));
        rates.deleteById(id);
    }

    private BigDecimal decimal(BigDecimal value) {
        try {
            return value.setScale(
                2,
                RoundingMode.UNNECESSARY
            );
        } catch (ArithmeticException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Use at most two decimal places"
            );
        }
    }

    public static BigDecimal amount(
        BigDecimal quantity,
        BigDecimal rate
    ) {
        return quantity.multiply(rate)
            .setScale(2, RoundingMode.HALF_UP);
    }

    public MilkCollection collect(CollectionInput input) {
        MilkRate rate = rates.findByMilkTypeAndFatAndSnf(
            input.milkType(),
            decimal(input.fat()),
            decimal(input.snf())
        ).orElseThrow(() ->
            new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "No matching rate. Add the exact milk type, fat and SNF rate first."
            )
        );

        MilkCollection collection = new MilkCollection();

        collection.farmer = required(
            farmers.findById(input.farmerId())
        );
        collection.date = input.date();
        collection.shift = input.shift();
        collection.milkType = input.milkType();
        collection.quantity = input.quantity();
        collection.fat = rate.fat;
        collection.snf = rate.snf;
        collection.appliedRate = rate.rate;
        collection.amount = amount(
            collection.quantity,
            rate.rate
        );

        return collections.save(collection);
    }

    @Transactional(readOnly = true)
    public List<MilkCollection> entries(
        String month,
        Long farmerId
    ) {
        List<MilkCollection> all;

        if (month == null || month.isBlank()) {
            all = collections.findAll();
        } else {
            YearMonth selectedMonth = YearMonth.parse(month);

            all = collections.findByDateBetweenOrderByDateAscIdAsc(
                selectedMonth.atDay(1),
                selectedMonth.atEndOfMonth()
            );
        }

        return all.stream()
            .filter(collection ->
                farmerId == null ||
                collection.farmer.id.equals(farmerId)
            )
            .sorted(
                Comparator.comparing(
                    (MilkCollection collection) -> collection.date
                ).thenComparing(collection -> collection.id)
            )
            .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> dashboard() {
        LocalDate today = LocalDate.now(
            ZoneId.of("Asia/Kolkata")
        );

        List<MilkCollection> rows =
            collections.findByDateBetweenOrderByDateAscIdAsc(
                today,
                today
            );

        BigDecimal litres = rows.stream()
            .map(collection -> collection.quantity)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAmount = rows.stream()
            .map(collection -> collection.amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
            "farmers", farmers.count(),
            "litres", litres,
            "amount", totalAmount
        );
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> report(String month) {
        Map<Long, List<MilkCollection>> groups =
            new LinkedHashMap<>();

        for (MilkCollection collection : entries(month, null)) {
            groups.computeIfAbsent(
                collection.farmer.id,
                key -> new ArrayList<>()
            ).add(collection);
        }

        List<Map<String, Object>> result = new ArrayList<>();

        for (List<MilkCollection> rows : groups.values()) {
            BigDecimal cow = BigDecimal.ZERO;
            BigDecimal buffalo = BigDecimal.ZERO;
            BigDecimal total = BigDecimal.ZERO;

            for (MilkCollection collection : rows) {
                if ("COW".equals(collection.milkType)) {
                    cow = cow.add(collection.quantity);
                } else {
                    buffalo = buffalo.add(collection.quantity);
                }

                total = total.add(collection.amount);
            }

            result.add(Map.of(
                "farmer", rows.get(0).farmer.name,
                "cow", cow,
                "buffalo", buffalo,
                "litres", cow.add(buffalo),
                "amount", total
            ));
        }

        return result;
    }
}