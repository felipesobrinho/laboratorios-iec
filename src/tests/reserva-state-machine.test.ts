import { transicaoValida, transicoesValidas } from '@/types'
import type { StatusReserva } from '@prisma/client'

const TODOS: StatusReserva[] = ['CRIADA', 'AGUARDANDO_CONFIRMACAO', 'CONFIRMADA', 'CONFLITO_DE_DATAS', 'REJEITADA']

describe('máquina de estados da reserva', () => {
  it('declara transições para todos os estados', () => {
    expect(Object.keys(transicoesValidas).sort()).toEqual([...TODOS].sort())
  })

  it('permite o caminho feliz: criada → aguardando → confirmada', () => {
    expect(transicaoValida('CRIADA', 'AGUARDANDO_CONFIRMACAO')).toBe(true)
    expect(transicaoValida('AGUARDANDO_CONFIRMACAO', 'CONFIRMADA')).toBe(true)
  })

  it('conflito volta para análise ou é rejeitado, nunca confirmado direto', () => {
    expect(transicaoValida('AGUARDANDO_CONFIRMACAO', 'CONFLITO_DE_DATAS')).toBe(true)
    expect(transicaoValida('CONFLITO_DE_DATAS', 'AGUARDANDO_CONFIRMACAO')).toBe(true)
    expect(transicaoValida('CONFLITO_DE_DATAS', 'REJEITADA')).toBe(true)
    expect(transicaoValida('CONFLITO_DE_DATAS', 'CONFIRMADA')).toBe(false)
  })

  it('confirmada e rejeitada são estados finais', () => {
    for (const proximo of TODOS) {
      expect(transicaoValida('CONFIRMADA', proximo)).toBe(false)
      expect(transicaoValida('REJEITADA', proximo)).toBe(false)
    }
  })

  it('não pula etapas: criada não vai direto para confirmada', () => {
    expect(transicaoValida('CRIADA', 'CONFIRMADA')).toBe(false)
    expect(transicaoValida('CRIADA', 'REJEITADA')).toBe(false)
  })
})
