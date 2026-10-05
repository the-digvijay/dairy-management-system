package com.dairy.repository;
import com.dairy.entity.MilkRate; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*; import java.math.BigDecimal; import java.time.LocalDate;
public interface MilkRateRepository extends JpaRepository<MilkRate,Long> { Optional<MilkRate> findByMilkTypeAndFatAndSnf(String type, BigDecimal fat, BigDecimal snf); }
