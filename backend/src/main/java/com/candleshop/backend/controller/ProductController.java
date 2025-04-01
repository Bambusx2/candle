package com.candleshop.backend.controller;

import com.candleshop.backend.dto.ProductDTO;
import com.candleshop.backend.dto.request.ProductRequest;
import com.candleshop.backend.dto.response.ApiResponse;
import com.candleshop.backend.mapper.ProductMapper;
import com.candleshop.backend.model.CandleCategory;
import com.candleshop.backend.model.Product;
import com.candleshop.backend.repository.CandleCategoryRepository;
import com.candleshop.backend.repository.ProductRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@CrossOrigin(origins = {"http://localhost:4200"}, maxAge = 3600, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api/products")
@Tag(name = "Product", description = "Product management APIs")
public class ProductController {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private CandleCategoryRepository categoryRepository;
    
    @Autowired
    private ProductMapper productMapper;
    
    // Get all products with pagination
    @Operation(
        summary = "Get all products",
        description = "Retrieve a paginated list of all products with optional sorting",
        tags = { "Product" }
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Successful operation",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))
        )
    })
    @GetMapping
    public ResponseEntity<Page<ProductDTO>> getAllProducts(
            @Parameter(description = "Page number (zero-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sorting criteria in the format: property(,asc|desc). Default sort order is ascending.") 
            @RequestParam(defaultValue = "id,asc") String[] sort) {
        
        String sortField = sort[0];
        String sortDirection = sort.length > 1 ? sort[1] : "asc";
        
        Sort.Direction direction = sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sortOrder = Sort.by(direction, sortField);
        
        Pageable pageable = PageRequest.of(page, size, sortOrder);
        Page<Product> productPage = productRepository.findAll(pageable);
        
        Page<ProductDTO> productDTOPage = productPage.map(productMapper::toDto);
        
        return ResponseEntity.ok(productDTOPage);
    }
    
    // Get product by ID
    @Operation(
        summary = "Get product by ID",
        description = "Retrieve a product by its ID",
        tags = { "Product" }
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Successful operation",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProductDTO.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Product not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(
            @Parameter(description = "ID of the product to retrieve") @PathVariable Long id) {
        Optional<Product> product = productRepository.findById(id);
        
        if (product.isPresent()) {
            return ResponseEntity.ok(productMapper.toDto(product.get()));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Create new product
    @Operation(
        summary = "Create a new product",
        description = "Create a new product (Admin only)",
        tags = { "Product" },
        security = { @SecurityRequirement(name = "Bearer Authentication") }
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Product created successfully",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createProduct(
            @Parameter(description = "Product details", required = true) 
            @Valid @RequestBody ProductRequest productRequest) {
        try {
            CandleCategory category = categoryRepository.findById(productRequest.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            
            Product product = productMapper.toEntity(productRequest);
            product.setCategory(category);
            
            Product savedProduct = productRepository.save(product);
            
            return ResponseEntity.ok(ApiResponse.<ProductDTO>success("Product created successfully", productMapper.toDto(savedProduct)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<String>error(e.getMessage()));
        }
    }
    
    // Update product
    @Operation(
        summary = "Update a product",
        description = "Update an existing product by ID (Admin only)",
        tags = { "Product" },
        security = { @SecurityRequirement(name = "Bearer Authentication") }
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Product updated successfully",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Product not found")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateProduct(
            @Parameter(description = "ID of the product to update") @PathVariable Long id, 
            @Parameter(description = "Updated product details", required = true) 
            @Valid @RequestBody ProductRequest productRequest) {
        try {
            Optional<Product> existingProduct = productRepository.findById(id);
            
            if (!existingProduct.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            CandleCategory category = categoryRepository.findById(productRequest.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            
            Product product = existingProduct.get();
            productMapper.updateProductFromRequest(productRequest, product);
            product.setCategory(category);
            
            Product updatedProduct = productRepository.save(product);
            
            return ResponseEntity.ok(ApiResponse.<ProductDTO>success("Product updated successfully", productMapper.toDto(updatedProduct)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<String>error(e.getMessage()));
        }
    }
    
    // Delete product
    @Operation(
        summary = "Delete a product",
        description = "Delete a product by ID (Admin only)",
        tags = { "Product" },
        security = { @SecurityRequirement(name = "Bearer Authentication") }
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Product deleted successfully",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Product not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteProduct(
            @Parameter(description = "ID of the product to delete") @PathVariable Long id) {
        try {
            Optional<Product> product = productRepository.findById(id);
            
            if (!product.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            productRepository.deleteById(id);
            
            return ResponseEntity.ok(ApiResponse.<Void>success("Product deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<String>error(e.getMessage()));
        }
    }
    
    // Get featured products
    @Operation(
        summary = "Get featured products",
        description = "Retrieve a list of featured products",
        tags = { "Product" }
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Successful operation",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProductDTO.class))
        )
    })
    @GetMapping("/featured")
    public ResponseEntity<List<ProductDTO>> getFeaturedProducts() {
        List<Product> products = productRepository.findByFeaturedTrue();
        List<ProductDTO> productDTOs = products.stream()
                .map(productMapper::toDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(productDTOs);
    }
    
    // Get best sellers
    @Operation(
        summary = "Get best seller products",
        description = "Retrieve a list of best-selling products",
        tags = { "Product" }
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Successful operation",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProductDTO.class))
        )
    })
    @GetMapping("/best-sellers")
    public ResponseEntity<List<ProductDTO>> getBestSellers() {
        List<Product> products = productRepository.findByBestSellerTrue();
        List<ProductDTO> productDTOs = products.stream()
                .map(productMapper::toDto)
                .toList();
        
        return ResponseEntity.ok(productDTOs);
    }
    
    // Get new arrivals
    @Operation(
        summary = "Get new arrival products",
        description = "Retrieve a list of new arrival products",
        tags = { "Product" }
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Successful operation",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProductDTO.class))
        )
    })
    @GetMapping("/new-arrivals")
    public ResponseEntity<List<ProductDTO>> getNewArrivals() {
        List<Product> products = productRepository.findByNewArrivalTrue();
        List<ProductDTO> productDTOs = products.stream()
                .map(productMapper::toDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(productDTOs);
    }
    
    // Get products by category
    @Operation(
        summary = "Get products by category",
        description = "Retrieve a paginated list of products by category ID",
        tags = { "Product" }
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Successful operation",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))
        )
    })
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<Page<ProductDTO>> getProductsByCategory(
            @Parameter(description = "ID of the category") @PathVariable Long categoryId,
            @Parameter(description = "Page number (zero-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = productRepository.findByCategoryId(categoryId, pageable);
        
        Page<ProductDTO> productDTOPage = productPage.map(productMapper::toDto);
        
        return ResponseEntity.ok(productDTOPage);
    }
    
    // Search products
    @Operation(
        summary = "Search products",
        description = "Search products by keyword (in name, description, and scent)",
        tags = { "Product" }
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Successful operation",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))
        )
    })
    @GetMapping("/search")
    public ResponseEntity<Page<ProductDTO>> searchProducts(
            @Parameter(description = "Search keyword") @RequestParam String keyword,
            @Parameter(description = "Page number (zero-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = productRepository.searchProducts(keyword, pageable);
        
        Page<ProductDTO> productDTOPage = productPage.map(productMapper::toDto);
        
        return ResponseEntity.ok(productDTOPage);
    }
    
    // Get distinct scents
    @Operation(
        summary = "Get distinct scents",
        description = "Retrieve a list of all distinct scents available in products",
        tags = { "Product" }
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Successful operation",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = String.class))
        )
    })
    @GetMapping("/scents")
    public ResponseEntity<List<String>> getDistinctScents() {
        List<String> scents = productRepository.findDistinctScents();
        return ResponseEntity.ok(scents);
    }
    
    // Get distinct sizes
    @Operation(
        summary = "Get distinct sizes",
        description = "Retrieve a list of all distinct sizes available in products",
        tags = { "Product" }
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Successful operation",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = String.class))
        )
    })
    @GetMapping("/sizes")
    public ResponseEntity<List<String>> getDistinctSizes() {
        List<String> sizes = productRepository.findDistinctSizes();
        return ResponseEntity.ok(sizes);
    }
} 