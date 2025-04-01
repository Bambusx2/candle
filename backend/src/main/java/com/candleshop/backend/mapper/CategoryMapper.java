package com.candleshop.backend.mapper;

import com.candleshop.backend.dto.CategoryDTO;
import com.candleshop.backend.dto.request.CategoryRequest;
import com.candleshop.backend.model.CandleCategory;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    @Mapping(target = "productCount", expression = "java(category.getProducts() != null ? category.getProducts().size() : 0)")
    CategoryDTO toDto(CandleCategory category);

    List<CategoryDTO> toDtoList(List<CandleCategory> categories);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "products", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    CandleCategory toEntity(CategoryRequest categoryRequest);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "products", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateCategoryFromRequest(CategoryRequest categoryRequest, @MappingTarget CandleCategory category);
} 