package com.candleshop.backend.mapper;

import com.candleshop.backend.dto.ProductDTO;
import com.candleshop.backend.dto.request.ProductRequest;
import com.candleshop.backend.model.CandleCategory;
import com.candleshop.backend.model.Product;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-04-01T14:37:35+0200",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.42.0.v20250325-2231, environment: Java 21.0.6 (Eclipse Adoptium)"
)
@Component
public class ProductMapperImpl implements ProductMapper {

    @Override
    public ProductDTO toDto(Product product) {
        if ( product == null ) {
            return null;
        }

        ProductDTO productDTO = new ProductDTO();

        productDTO.setCategoryId( productCategoryId( product ) );
        productDTO.setCategoryName( productCategoryName( product ) );
        productDTO.setBestSeller( product.isBestSeller() );
        productDTO.setBurnTime( product.getBurnTime() );
        productDTO.setCreatedAt( product.getCreatedAt() );
        productDTO.setDescription( product.getDescription() );
        productDTO.setFeatured( product.isFeatured() );
        productDTO.setId( product.getId() );
        productDTO.setImageUrl( product.getImageUrl() );
        productDTO.setName( product.getName() );
        productDTO.setNewArrival( product.isNewArrival() );
        productDTO.setPrice( product.getPrice() );
        productDTO.setRating( product.getRating() );
        productDTO.setReviewCount( product.getReviewCount() );
        productDTO.setScent( product.getScent() );
        productDTO.setSize( product.getSize() );
        productDTO.setStockStatus( product.getStockStatus() );
        productDTO.setUpdatedAt( product.getUpdatedAt() );
        productDTO.setWeight( product.getWeight() );

        return productDTO;
    }

    @Override
    public List<ProductDTO> toDtoList(List<Product> products) {
        if ( products == null ) {
            return null;
        }

        List<ProductDTO> list = new ArrayList<ProductDTO>( products.size() );
        for ( Product product : products ) {
            list.add( toDto( product ) );
        }

        return list;
    }

    @Override
    public Product toEntity(ProductRequest productRequest) {
        if ( productRequest == null ) {
            return null;
        }

        Product product = new Product();

        product.setBestSeller( productRequest.isBestSeller() );
        product.setBurnTime( productRequest.getBurnTime() );
        product.setDescription( productRequest.getDescription() );
        product.setFeatured( productRequest.isFeatured() );
        product.setImageUrl( productRequest.getImageUrl() );
        product.setName( productRequest.getName() );
        product.setNewArrival( productRequest.isNewArrival() );
        product.setPrice( productRequest.getPrice() );
        product.setRating( productRequest.getRating() );
        product.setReviewCount( productRequest.getReviewCount() );
        product.setScent( productRequest.getScent() );
        product.setSize( productRequest.getSize() );
        product.setStockStatus( productRequest.getStockStatus() );
        product.setWeight( productRequest.getWeight() );

        return product;
    }

    @Override
    public void updateProductFromRequest(ProductRequest productRequest, Product product) {
        if ( productRequest == null ) {
            return;
        }

        product.setBestSeller( productRequest.isBestSeller() );
        product.setBurnTime( productRequest.getBurnTime() );
        product.setDescription( productRequest.getDescription() );
        product.setFeatured( productRequest.isFeatured() );
        product.setImageUrl( productRequest.getImageUrl() );
        product.setName( productRequest.getName() );
        product.setNewArrival( productRequest.isNewArrival() );
        product.setPrice( productRequest.getPrice() );
        product.setRating( productRequest.getRating() );
        product.setReviewCount( productRequest.getReviewCount() );
        product.setScent( productRequest.getScent() );
        product.setSize( productRequest.getSize() );
        product.setStockStatus( productRequest.getStockStatus() );
        product.setWeight( productRequest.getWeight() );
    }

    private Long productCategoryId(Product product) {
        if ( product == null ) {
            return null;
        }
        CandleCategory category = product.getCategory();
        if ( category == null ) {
            return null;
        }
        Long id = category.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String productCategoryName(Product product) {
        if ( product == null ) {
            return null;
        }
        CandleCategory category = product.getCategory();
        if ( category == null ) {
            return null;
        }
        String name = category.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }
}
