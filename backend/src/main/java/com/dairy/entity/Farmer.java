package com.dairy.entity;

import jakarta.persistence.*;

@Entity
public class Farmer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false)
    public String name;

    @Column(nullable = false)
    public String mobile;

    @Column(nullable = false)
    public String village;

    @Column(length = 100)
    public String accountHolderName;

    @Column(length = 34)
    public String bankAccountNumber;

    @Column(length = 11)
    public String ifscCode;
}