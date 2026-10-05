package com.dairy.repository;
import com.dairy.entity.MilkCollection; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*; import java.math.BigDecimal; import java.time.LocalDate;
public interface MilkCollectionRepository extends JpaRepository<MilkCollection,Long> { boolean existsByFarmerId(Long id); List<MilkCollection> findByDateBetweenOrderByDateAscIdAsc(LocalDate start, LocalDate end); }
