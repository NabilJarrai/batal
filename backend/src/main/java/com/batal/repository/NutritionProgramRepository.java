package com.batal.repository;

import com.batal.entity.NutritionProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NutritionProgramRepository extends JpaRepository<NutritionProgram, Long> {
    
}
