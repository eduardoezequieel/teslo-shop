import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

  async findAll() {
    try {
      return await this.productRepository.find();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(id: string) {
    try {
      const product = await this.productRepository.findOneBy({ id });

      if (!product)
        throw new BadRequestException(`Product with id ${id} not found`);

      return;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
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
