package com.candleshop.backend.mapper;

import com.candleshop.backend.dto.CategoryDTO;
import com.candleshop.backend.dto.request.CategoryRequest;
import com.candleshop.backend.model.CandleCategory;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-04-01T14:00:35+0200",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.42.0.v20250325-2231, environment: Java 21.0.6 (Eclipse Adoptium)"
)
@Component
public class CategoryMapperImpl implements CategoryMapper {

    @Override
    public CategoryDTO toDto(CandleCategory category) {
        if ( category == null ) {
            return null;
        }

        CategoryDTO categoryDTO = new CategoryDTO();

        categoryDTO.setCreatedAt( category.getCreatedAt() );
        categoryDTO.setDescription( category.getDescription() );
        categoryDTO.setId( category.getId() );
        categoryDTO.setName( category.getName() );
        categoryDTO.setUpdatedAt( category.getUpdatedAt() );

        categoryDTO.setProductCount( category.getProducts() != null ? category.getProducts().size() : 0 );

        return categoryDTO;
    }

    @Override
    public List<CategoryDTO> toDtoList(List<CandleCategory> categories) {
        if ( categories == null ) {
            return null;
        }

        List<CategoryDTO> list = new ArrayList<CategoryDTO>( categories.size() );
        for ( CandleCategory candleCategory : categories ) {
            list.add( toDto( candleCategory ) );
        }

        return list;
    }

    @Override
    public CandleCategory toEntity(CategoryRequest categoryRequest) {
        if ( categoryRequest == null ) {
            return null;
        }

        CandleCategory candleCategory = new CandleCategory();

        candleCategory.setDescription( categoryRequest.getDescription() );
        candleCategory.setName( categoryRequest.getName() );

        return candleCategory;
    }

    @Override
    public void updateCategoryFromRequest(CategoryRequest categoryRequest, CandleCategory category) {
        if ( categoryRequest == null ) {
            return;
        }

        category.setDescription( categoryRequest.getDescription() );
        category.setName( categoryRequest.getName() );
    }
}
