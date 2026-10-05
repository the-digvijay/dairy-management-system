package com.dairy.controller;
import com.dairy.service.DairyService; import com.dairy.entity.*; import com.dairy.dto.Requests.*;
import jakarta.validation.Valid; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api") @CrossOrigin(origins="http://localhost:5173")
public class DairyController {
private final DairyService s; public DairyController(DairyService s){this.s=s;}
@GetMapping("/farmers") public List<Farmer> farmers(){return s.listFarmers();}
@PostMapping("/farmers") public Farmer addFarmer(@Valid @RequestBody FarmerInput in){return s.farmer(null,in);}
@PutMapping("/farmers/{id}") public Farmer editFarmer(@PathVariable Long id,@Valid @RequestBody FarmerInput in){return s.farmer(id,in);}
@DeleteMapping("/farmers/{id}") public void deleteFarmer(@PathVariable Long id){s.deleteFarmer(id);}
@GetMapping("/rates") public List<MilkRate> rates(){return s.listRates();}
@PostMapping("/rates") public MilkRate addRate(@Valid @RequestBody RateInput in){return s.rate(null,in);}
@PutMapping("/rates/{id}") public MilkRate editRate(@PathVariable Long id,@Valid @RequestBody RateInput in){return s.rate(id,in);}
@DeleteMapping("/rates/{id}") public void deleteRate(@PathVariable Long id){s.deleteRate(id);}
@GetMapping("/collections") public List<MilkCollection> entries(@RequestParam(required=false) String month,@RequestParam(required=false) Long farmerId){return s.entries(month,farmerId);}
@PostMapping("/collections") public MilkCollection collect(@Valid @RequestBody CollectionInput in){return s.collect(in);}
@GetMapping("/dashboard") public Map<String,Object> dashboard(){return s.dashboard();}
@GetMapping("/reports") public List<Map<String,Object>> report(@RequestParam String month){return s.report(month);}
}
