package com.dairy.entity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
@Entity @Table(uniqueConstraints=@UniqueConstraint(columnNames={"milkType","fat","snf"}))
public class MilkRate { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
@Column(nullable=false) public String milkType;
@Column(nullable=false,precision=5,scale=2) public BigDecimal fat;
@Column(nullable=false,precision=5,scale=2) public BigDecimal snf;
@Column(nullable=false,precision=10,scale=2) public BigDecimal rate;
}
