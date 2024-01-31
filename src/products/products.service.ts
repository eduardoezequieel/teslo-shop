import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate } from 'uuid';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}
  async create(createProductDto: CreateProductDto) {
    try {
      const newProduct = this.productRepository.create(createProductDto);
      return await this.productRepository.save(newProduct);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { limit = 10, offset = 0 } = paginationDto;
      return await this.productRepository.find({
        take: limit,
        skip: offset,
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(term: string) {
    try {
      let product: Product;

      if (validate(term)) {
        product = await this.productRepository.findOneBy({ id: term });
      } else {
        const queryBuilder = this.productRepository.createQueryBuilder();
        product = await queryBuilder
          .where('title ILIKE :title or slug ILIKE :slug', {
            title: term.toLowerCase(),
            slug: term.toLocaleLowerCase(),
          })
          .getOne();
      }

      if (!product)
        throw new BadRequestException(`Product with term ${term} not found`);

      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({
      id,
      ...updateProductDto,
    });

    if (!product)
      throw new NotFoundException(`Product with id ${id} not found`);

    try {
      return await this.productRepository.save(product);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      const result = await this.productRepository.delete(id);

      if (result.affected === 0)
        throw new BadRequestException(`Product with id ${id} not found`);

      return {
        message: `Product with id ${id} was deleted`,
        result,
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: any) {
    if (error instanceof BadRequestException) {
      throw error;
    }

    if (error.code === '23505') throw new BadRequestException(error.detail);

    console.log(error);

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
