import { EntityRepository, Repository } from 'typeorm';
import { Customer } from '../entity/customer.entity';
import { DtoCustomerDetails } from '../dto/customer-details.dto';
import { User } from '../entity/user.entity';
import { Logger } from '@nestjs/common';
import { UserRole } from '../user-role.interface';
import { DtoCreditCard } from '../dto/credit-card.dto';
import { DtoVehicle } from '../dto/vehicle.dto';
import { Vehicle } from '../entity/vehicle.entity';
@EntityRepository(Customer)
export class CustomerRepository extends Repository<Customer> {
  async setCustomerDetails(
    userId: string,
    details: DtoCustomerDetails,
  ): Promise<Customer> {
    try {
      const user = await this.manager.findOneOrFail(User, userId);
      if (user.role !== UserRole.CUSTOMER) {
        throw new Error('User is not a customer');
      }
      let cust = await this.manager.preload(Customer, {
        userId,
        ...details,
      });

      if (!cust) {
        cust = await this.manager.create(Customer, {
          userId,
          ...details,
        });
      }
      return await this.manager.save(cust);
    } catch (err) {
      Logger.error(err, err.stack, 'CustomerRepository');
      return null;
    }
  }

  async setCreditCard(userId: string, card: DtoCreditCard): Promise<Customer> {
    try {
      const customer = await this.manager.findOneOrFail(Customer, userId);

      customer.creditCard = {
        cardNumber: card.cardNumber,
        name: card.name,
        expireMonth: card.expireMonth,
        expireYear: card.expireYear,
        ccv: card.ccv,
      };

      return await this.manager.save(customer);
    } catch (err) {
      Logger.error(err, err.stack, 'CustomerRepository');
      return null;
    }
  }

  async addVehicles(userId: string, vehicles: DtoVehicle[]): Promise<Customer> {
    try {
      const customer = await this.manager.findOneOrFail(Customer, userId, {
        relations: ['vehicles'],
      });

      // const createdVehicles = await Promise.all(
      //   vehicles.map(v => {
      //     const newVehicle = this.manager.create(Vehicle, v);
      //     return this.manager.save(newVehicle);
      //   }),
      // );

      const createdVehicles = vehicles.map(v => {
        v.plateNumber = v.plateNumber.toUpperCase();
        const newVehicle = this.manager.create(Vehicle, v);
        newVehicle.customer = customer;
        return newVehicle;
      });

      for (let i = 0; i < createdVehicles.length; i++) {
        const existingVehicle = customer.vehicles.find((element: Vehicle) => {
          return element.plateNumber == createdVehicles[i].plateNumber;
        });
        if (existingVehicle) {
          existingVehicle.active = true;
          createdVehicles[i] = existingVehicle;
        }
      }

      await this.manager.save(createdVehicles);

      // while (createdVehicles.length != 0) {
      //   const v = createdVehicles.pop();
      //   const existingVehicle = customer.vehicles.find((element: Vehicle) => {
      //     return (
      //       element.plateNumber == v.plateNumber
      //     );
      //   });
      //   if (existingVehicle) {
      //     existingVehicle.active = true;
      //   } else {
      //     customer.vehicles.push(v);
      //   }
      // }

      return await this.manager.findOne(Customer, customer);
    } catch (err) {
      Logger.error(err, err.stack, 'CustomerRepository');
      return null;
    }
  }
}
