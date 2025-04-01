package com.candleshop.backend.repository;

import com.candleshop.backend.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);
    
    List<Product> findByFeaturedTrue();
    
    List<Product> findByNewArrivalTrue();
    
    List<Product> findByBestSellerTrue();
    
    @Query("SELECT p FROM Product p WHERE p.name LIKE %:keyword% OR p.description LIKE %:keyword% OR p.scent LIKE %:keyword%")
    Page<Product> searchProducts(@Param("keyword") String keyword, Pageable pageable);
    
    @Query("SELECT p FROM Product p JOIN p.category c WHERE c.name = :categoryName")
    Page<Product> findByCategoryName(@Param("categoryName") String categoryName, Pageable pageable);
    
    @Query("SELECT DISTINCT p.scent FROM Product p WHERE p.scent IS NOT NULL ORDER BY p.scent")
    List<String> findDistinctScents();
    
    @Query("SELECT DISTINCT p.size FROM Product p WHERE p.size IS NOT NULL ORDER BY p.size")
    List<String> findDistinctSizes();
    
    Page<Product> findByPriceBetween(Double minPrice, Double maxPrice, Pageable pageable);
} 