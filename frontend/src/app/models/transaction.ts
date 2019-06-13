export class Transaction {
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  transaction: {
    from: string;
    to: string;
  };
  value: string;
}
