package com.candleshop.backend.controller;

import com.candleshop.backend.dto.CategoryDTO;
import com.candleshop.backend.dto.request.CategoryRequest;
import com.candleshop.backend.dto.response.ApiResponse;
import com.candleshop.backend.model.CandleCategory;
import com.candleshop.backend.repository.CandleCategoryRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@CrossOrigin(origins = {"http://localhost:4200"}, maxAge = 3600, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    
    @Autowired
    private CandleCategoryRepository categoryRepository;
    
    // Get all categories
    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        List<CandleCategory> categories = categoryRepository.findAll();
        List<CategoryDTO> categoryDTOs = categories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(categoryDTOs);
    }
    
    // Get category by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getCategoryById(@PathVariable Long id) {
        Optional<CandleCategory> category = categoryRepository.findById(id);
        
        if (category.isPresent()) {
            return ResponseEntity.ok(convertToDTO(category.get()));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Create new category
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCategory(@Valid @RequestBody CategoryRequest categoryRequest) {
        try {
            if (categoryRepository.existsByName(categoryRequest.getName())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Category name already exists"));
            }
            
            CandleCategory category = new CandleCategory();
            category.setName(categoryRequest.getName());
            category.setDescription(categoryRequest.getDescription());
            
            CandleCategory savedCategory = categoryRepository.save(category);
            
            return ResponseEntity.ok(ApiResponse.success("Category created successfully", convertToDTO(savedCategory)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // Update category
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest categoryRequest) {
        try {
            Optional<CandleCategory> existingCategory = categoryRepository.findById(id);
            
            if (!existingCategory.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            // Check if name is being changed and if the new name already exists
            if (!existingCategory.get().getName().equals(categoryRequest.getName()) &&
                    categoryRepository.existsByName(categoryRequest.getName())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Category name already exists"));
            }
            
            CandleCategory category = existingCategory.get();
            category.setName(categoryRequest.getName());
            category.setDescription(categoryRequest.getDescription());
            
            CandleCategory updatedCategory = categoryRepository.save(category);
            
            return ResponseEntity.ok(ApiResponse.success("Category updated successfully", convertToDTO(updatedCategory)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // Delete category
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            Optional<CandleCategory> category = categoryRepository.findById(id);
            
            if (!category.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            // Check if the category is in use by any products
            if (!category.get().getProducts().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Cannot delete category that is in use by products"));
            }
            
            categoryRepository.deleteById(id);
            
            return ResponseEntity.ok(ApiResponse.success("Category deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // Convert CandleCategory entity to CategoryDTO
    private CategoryDTO convertToDTO(CandleCategory category) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setProductCount(category.getProducts().size());
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        
        return dto;
    }
} 