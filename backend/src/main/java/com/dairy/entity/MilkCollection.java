package com.dairy.entity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
@Entity 
public class MilkCollection { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
@ManyToOne(optional=false) public Farmer farmer;
@Column(nullable=false) public LocalDate date;
@Column(nullable=false) public String shift;
@Column(nullable=false) public String milkType;
@Column(nullable=false,precision=10,scale=3) public BigDecimal quantity;
@Column(nullable=false,precision=5,scale=2) public BigDecimal fat;
@Column(nullable=false,precision=5,scale=2) public BigDecimal snf;
@Column(nullable=false,precision=10,scale=2) public BigDecimal appliedRate;
@Column(nullable=false,precision=15,scale=2) public BigDecimal amount;
}
