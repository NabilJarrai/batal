package com.batal.repository;

import com.batal.entity.SkillScore;
import com.batal.entity.Assessment;
import com.batal.entity.Skill;
import com.batal.entity.User;
import com.batal.entity.Player;
import com.batal.entity.enums.SkillCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SkillScoreRepository extends JpaRepository<SkillScore, Long> {
    
}
