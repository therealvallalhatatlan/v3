import { AnimationProvider } from '../../types/animation';
import { ReplicateAnimationProvider } from './replicate';
import { AnimationProviderClient } from './types';

export function getAnimationProvider(provider: AnimationProvider): AnimationProviderClient {
  if (provider === 'replicate') {
    return new ReplicateAnimationProvider();
  }
  throw new Error(`Unsupported animation provider: ${provider}`);
}
