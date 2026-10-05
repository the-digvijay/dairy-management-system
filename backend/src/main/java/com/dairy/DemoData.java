package com.dairy;
import org.springframework.context.annotation.*;import org.springframework.boot.CommandLineRunner;import com.dairy.service.DairyService;import com.dairy.dto.Requests.*;import java.math.BigDecimal;import java.time.LocalDate;
@Configuration @Profile("demo") public class DemoData {
@Bean CommandLineRunner seed(DairyService s){return args->{if(!s.listFarmers().isEmpty()||!s.listRates().isEmpty())return;var f=s.farmer(null,new FarmerInput("Digvijay Thanekar","9000000000","Barave"));s.rate(null,new RateInput("COW",new BigDecimal("3.50"),new BigDecimal("8.50"),new BigDecimal("35.00")));s.rate(null,new RateInput("BUFFALO",new BigDecimal("6.00"),new BigDecimal("9.00"),new BigDecimal("55.00")));s.collect(new CollectionInput(f.id,LocalDate.now(),"MORNING","COW",new BigDecimal("5.000"),new BigDecimal("3.50"),new BigDecimal("8.50")));};}
}
