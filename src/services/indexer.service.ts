import { Injectable } from '@nestjs/common';
import { Indexer } from 'algosdk';
import { AssetHolding } from '../interfaces/asset-holding.interface';
import { Asset } from '../interfaces/asset.interface';
import { BlockchainService } from './blockchain.service';

@Injectable()
export class IndexerService extends BlockchainService {
  private client: Indexer;
  constructor() {
    super();
    this.client = new Indexer(
      process.env.INDEXER_TOKEN,
      process.env.INDEXER_SERVER,
      process.env.INDEXER_PORT,
    );
  }

  async getAssetInfo(assetId: number): Promise<Asset> {
    const result = await this.client.lookupAssetByID(assetId).do();
    const {deleted, index, params} = result.asset;
    return {
      deleted,
      id: index,
      creator: params.creator,
      manager: params.manager,
      name: params.name,
      reserve: params.reserve,
      unitName: params['unit-name'],
      total: params.total,
      decimals: params.decimals,
    };
  }

  async getAssetHoldingForAccount(address: string, assetId: number): Promise<AssetHolding> {
    const result: Record<string, any[]> = await this.client.lookupAccountAssets(address)
      .assetId(assetId)
      .do();
    const asset = result['assets'].shift();
    return {
      amount: asset.amount,
      isFrozen: asset['is-frozen']
    };
  }
}
