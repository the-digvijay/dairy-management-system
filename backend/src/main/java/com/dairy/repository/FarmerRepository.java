package com.dairy.repository;
import com.dairy.entity.Farmer; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*; import java.math.BigDecimal; import java.time.LocalDate;
public interface FarmerRepository extends JpaRepository<Farmer,Long> {  }
