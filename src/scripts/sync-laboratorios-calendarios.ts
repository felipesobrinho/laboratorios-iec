/**
 * Sincroniza os laboratórios reais (a partir da lista de agendas do Google
 * Calendar fornecida) com a tabela `laboratorios`, já vinculando o
 * googleCalendarId de cada um.
 *
 * Use este script no lugar de mapear manualmente um a um — ele resolve a
 * criação do laboratório (se ainda não existir) E o vínculo da agenda numa
 * única operação idempotente (upsert).
 *
 * Execução:
 *   npx tsx scripts/sync-laboratorios-calendarios.ts
 *
 * Pré-requisito: migration add_google_calendar_id_laboratorio já aplicada.
 */
import { prisma } from '../lib/prisma/client'

// ─── Mapa: laboratório físico → calendarId ────────────────────────────────────
// Preencha com as agendas reais do seu ambiente (uma agenda do Google por laboratório).
// Os valores abaixo são FICTÍCIOS: servem só para mostrar o formato.

interface LaboratorioSeed {
  codigo:           string   // código único interno do sistema
  nome:             string   // nome de exibição
  capacidade:       number   // 0 = não informado (usa o padrão 30)
  localizacao:      string   // prédio
  googleCalendarId: string
}

const LABORATORIOS: LaboratorioSeed[] = [
  {
    codigo: 'BLOCO-A-LAB101',
    nome:   'Bloco A - Lab 101',
    capacidade: 30,
    localizacao: 'Bloco A',
    googleCalendarId: 'lab-101-demo@group.calendar.google.com',
  },
  {
    codigo: 'BLOCO-A-LAB102',
    nome:   'Bloco A - Lab 102',
    capacidade: 24,
    localizacao: 'Bloco A',
    googleCalendarId: 'lab-102-demo@group.calendar.google.com',
  },
  {
    codigo: 'BLOCO-B-LAB201',
    nome:   'Bloco B - Lab 201',
    capacidade: 0, // não informado — ajuste manualmente
    localizacao: 'Bloco B',
    googleCalendarId: 'lab-201-demo@group.calendar.google.com',
  },
]

// Agendas que não representam um laboratório reservável (eventos gerais, testes,
// servidores de acesso remoto) ficam de fora deste mapa de propósito.

async function main() {
  console.log(`🔄 Sincronizando ${LABORATORIOS.length} laboratório(s)...\n`)

  for (const lab of LABORATORIOS) {
    const capacidadeFinal = lab.capacidade > 0 ? lab.capacidade : 30 // fallback razoável

    const resultado = await prisma.laboratorio.upsert({
      where:  { codigo: lab.codigo },
      update: {
        nome:             lab.nome,
        localizacao:      lab.localizacao,
        googleCalendarId: lab.googleCalendarId,
        ...(lab.capacidade > 0 ? { capacidade: lab.capacidade } : {}),
      },
      create: {
        codigo:           lab.codigo,
        nome:             lab.nome,
        capacidade:       capacidadeFinal,
        recursos:         ['Computadores'],
        localizacao:      lab.localizacao,
        googleCalendarId: lab.googleCalendarId,
      },
    })

    const avisoCapacidade = lab.capacidade === 0
      ? '  ⚠️  capacidade não informada na lista original, usando valor padrão (30) — ajuste manualmente se necessário'
      : ''

    console.log(`✅ ${resultado.nome} (${resultado.codigo}) → agenda vinculada${avisoCapacidade}`)
  }

  console.log('\n✨ Sincronização concluída.')
  console.log('\nLaboratórios SEM dados de capacidade reais na lista original (ajustar manualmente se souber):')
  LABORATORIOS.filter((l) => l.capacidade === 0).forEach((l) => console.log(`  - ${l.nome} (${l.codigo})`))
}

main()
  .catch((err) => {
    console.error('❌ Erro na sincronização:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())