import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class AverageOfCost {
  @PrimaryColumn({ type: "datetime" })
  "date"!: Date;

  @Column({ nullable: true })
  "5KM"!: number;

  @Column({ nullable: true })
  "10KM"!: number;

  @Column({ nullable: true })
  "15KM"!: number;

  @Column({ nullable: true })
  "20KM"!: number;

  @Column({ nullable: true })
  "25KM"!: number;

  @Column({ nullable: true })
  "30KM"!: number;

  @Column({ nullable: true })
  "40KM"!: number;

  @Column({ nullable: true })
  "50KM"!: number;

  @Column({ nullable: true })
  "60KM"!: number;

  @Column({ nullable: true })
  "60+KM"!: number;
}

type AverageOfCostKeys = keyof AverageOfCost;

export type DistanceUnit = Exclude<AverageOfCostKeys, "date">;
