import { describe, expect, it } from 'vitest';
import type { EmbedButton } from '../../shared/protocol';
import { finishButton, labelToId } from './components/EditModal';

const button = (patch: Partial<EmbedButton>): EmbedButton => ({ id: 'a', label: 'Go', style: 'Primary', customId: '', url: '', ...patch });

describe('custom IDs from labels', () => {
  it('turns a label into a readable ID', () => {
    expect(labelToId('Get Roles!')).toBe('get_roles');
    expect(labelToId('🎁 Claim Café Reward')).toBe('claim_cafe_reward');
    expect(labelToId('🎉')).toBe('button');
  });

  it('keeps IDs unique across the message', () => {
    expect(finishButton(button({ label: 'Get Roles' }), ['get_roles']).customId).toBe('get_roles_2');
    expect(finishButton(button({ label: 'Get Roles' }), ['get_roles', 'get_roles_2']).customId).toBe('get_roles_3');
  });

  it('leaves link buttons alone apart from trimming the URL', () => {
    expect(finishButton(button({ style: 'Link', url: ' https://x.test ' }), [])).toMatchObject({ customId: '', url: 'https://x.test' });
  });
});
