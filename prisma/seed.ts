/**
 * Seed com dados 100% FICTÍCIOS para desenvolvimento, demos e prints.
 * Nenhum nome, e-mail, código de pessoa, laboratório ou agenda real.
 */
import { PrismaClient, StatusReserva, TipoEvento, ModalidadeReserva } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Dia (meia-noite UTC) relativo à segunda-feira da semana atual
function diaDaSemana(offset: number): Date {
  const hoje = new Date()
  const d = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()))
  const diaSemana = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - diaSemana + 1 + offset)
  return d
}

async function main() {
  console.log('🌱 Seed fictício...')
  const senhaHash = await bcrypt.hash('Demo@1234', 12)

  const [admin, operador, apoio] = await Promise.all([
    prisma.usuario.upsert({
      where: { email: 'admin@exemplo.com' },
      update: {},
      create: { nome: 'Ana Demo', email: 'admin@exemplo.com', senhaHash, perfil: 'ADMINISTRADOR' },
    }),
    prisma.usuario.upsert({
      where: { email: 'operador@exemplo.com' },
      update: {},
      create: { nome: 'Bruno Teste', email: 'operador@exemplo.com', senhaHash, perfil: 'OPERADOR_TI', codigoPessoa: '000001' },
    }),
    prisma.usuario.upsert({
      where: { email: 'apoio@exemplo.com' },
      update: {},
      create: { nome: 'Carla Exemplo', email: 'apoio@exemplo.com', senhaHash, perfil: 'APOIO_ACADEMICO' },
    }),
  ])

  const labsData = [
    { codigo: 'BLOCO-A-LAB101', nome: 'Bloco A - Lab 101', capacidade: 30, recursos: ['Computadores', 'Projetor'], localizacao: 'Bloco A' },
    { codigo: 'BLOCO-A-LAB102', nome: 'Bloco A - Lab 102', capacidade: 24, recursos: ['Computadores', 'Lousa digital'], localizacao: 'Bloco A' },
    { codigo: 'BLOCO-B-LAB201', nome: 'Bloco B - Lab 201', capacidade: 32, recursos: ['Computadores', 'Projetor', 'Ar-condicionado'], localizacao: 'Bloco B' },
    { codigo: 'BLOCO-B-REDES', nome: 'Bloco B - Lab de Redes', capacidade: 20, recursos: ['Switches', 'Roteadores', 'Rack'], localizacao: 'Bloco B' },
    { codigo: 'BLOCO-C-MAKER', nome: 'Bloco C - Espaço Maker', capacidade: 18, recursos: ['Impressora 3D', 'Bancadas'], localizacao: 'Bloco C' },
  ]
  const labs = await Promise.all(
    labsData.map((l) => prisma.laboratorio.upsert({ where: { codigo: l.codigo }, update: {}, create: l })),
  )

  const profsData = [
    { nome: 'Prof. Diego Fictício', email: 'diego.ficticio@exemplo.com', matricula: 'P-0001', departamento: 'Computação' },
    { nome: 'Profa. Elisa Modelo', email: 'elisa.modelo@exemplo.com', matricula: 'P-0002', departamento: 'Engenharia' },
    { nome: 'Prof. Fábio Amostra', email: 'fabio.amostra@exemplo.com', matricula: 'P-0003', departamento: 'Computação' },
    { nome: 'Profa. Gabriela Teste', email: 'gabriela.teste@exemplo.com', matricula: 'P-0004', departamento: 'Design' },
  ]
  const profs = await Promise.all(
    profsData.map((p) => prisma.professor.upsert({ where: { email: p.email }, update: {}, create: p })),
  )

  const turmasData = [
    { codigo: 'ES-2026-2-A', nome: 'Engenharia de Software', curso: 'Pós em Engenharia de Software', codigoDisciplina: 'ES101', numOferta: '101', prof: 0 },
    { codigo: 'DS-2026-2-B', nome: 'Ciência de Dados com Python', curso: 'Pós em Ciência de Dados', codigoDisciplina: 'CD210', numOferta: '102', prof: 1 },
    { codigo: 'RC-2026-2-A', nome: 'Redes de Computadores', curso: 'Pós em Infraestrutura', codigoDisciplina: 'RC150', numOferta: '103', prof: 2 },
    { codigo: 'UX-2026-2-A', nome: 'UX e Prototipação', curso: 'Pós em Design de Produto', codigoDisciplina: 'UX120', numOferta: '104', prof: 3 },
    { codigo: 'IA-2026-2-A', nome: 'IA Generativa Aplicada', curso: 'Pós em Inteligência Artificial', codigoDisciplina: 'IA300', numOferta: '105', prof: 0 },
  ]
  const turmas = await Promise.all(
    turmasData.map((t) =>
      prisma.turma.upsert({
        where: { codigo: t.codigo },
        update: {},
        create: {
          codigo: t.codigo, nome: t.nome, semestre: '2026/2', curso: t.curso,
          codigoDisciplina: t.codigoDisciplina, numOferta: t.numOferta, professorId: profs[t.prof].id,
        },
      }),
    ),
  )

  // Reservas em todos os estados da máquina, na semana atual e na próxima
  const reservas: {
    titulo: string; turma: number; status: StatusReserva; lab?: number; modalidade: ModalidadeReserva
    softwares: string; alunos: number; datas: [number, string, string][]; motivo?: string; protocolo?: string
  }[] = [
    { titulo: 'Aula prática — testes automatizados', turma: 0, status: 'CONFIRMADA', lab: 0, modalidade: 'PRESENCIAL', softwares: 'VS Code, Node.js', alunos: 28, datas: [[0, '19:00', '22:30'], [7, '19:00', '22:30']], protocolo: 'DEMO-000101' },
    { titulo: 'Laboratório de pandas e notebooks', turma: 1, status: 'CONFIRMADA', lab: 2, modalidade: 'PRESENCIAL', softwares: 'Python, Jupyter', alunos: 30, datas: [[1, '19:00', '22:30']], protocolo: 'DEMO-000102' },
    { titulo: 'Configuração de VLANs', turma: 2, status: 'AGUARDANDO_CONFIRMACAO', modalidade: 'PRESENCIAL', softwares: 'Packet Tracer', alunos: 18, datas: [[2, '19:00', '22:30']], protocolo: 'DEMO-000103' },
    { titulo: 'Oficina de protótipos no Figma', turma: 3, status: 'AGUARDANDO_CONFIRMACAO', modalidade: 'PRESENCIAL', softwares: 'Figma', alunos: 22, datas: [[3, '08:00', '12:00']], protocolo: 'DEMO-000104' },
    { titulo: 'Avaliação prática — RAG com LLMs', turma: 4, status: 'AGUARDANDO_CONFIRMACAO', modalidade: 'PRESENCIAL', softwares: 'Python, Docker', alunos: 26, datas: [[4, '19:00', '22:30']], protocolo: 'DEMO-000105' },
    { titulo: 'Revisão de arquitetura', turma: 0, status: 'CONFLITO_DE_DATAS', modalidade: 'PRESENCIAL', softwares: 'VS Code', alunos: 25, datas: [[0, '20:00', '22:00']], protocolo: 'DEMO-000106' },
    { titulo: 'Aula remota — APIs REST', turma: 4, status: 'CONFIRMADA', lab: 1, modalidade: 'REMOTO', softwares: 'Postman', alunos: 35, datas: [[2, '08:00', '11:30']] },
    { titulo: 'Montagem de cabeamento', turma: 2, status: 'REJEITADA', modalidade: 'PRESENCIAL', softwares: 'Nenhum', alunos: 15, datas: [[5, '08:00', '12:00']], motivo: 'Laboratório de Redes em manutenção nesta data', protocolo: 'DEMO-000107' },
    { titulo: 'Dashboard com Power BI', turma: 1, status: 'AGUARDANDO_CONFIRMACAO', modalidade: 'PRESENCIAL', softwares: 'Power BI', alunos: 24, datas: [[8, '19:00', '22:30']], protocolo: 'DEMO-000108' },
  ]

  let criadas = 0
  for (const r of reservas) {
    const existe = await prisma.solicitacaoReserva.findFirst({ where: { titulo: r.titulo } })
    if (existe) continue
    const turma = turmas[r.turma]
    const reserva = await prisma.solicitacaoReserva.create({
      data: {
        titulo: r.titulo,
        status: r.status,
        modalidadeReserva: r.modalidade,
        softwaresUtilizados: r.softwares,
        numeroAlunos: r.alunos,
        solicitanteId: apoio.id,
        professorId: turma.professorId,
        turmaId: turma.id,
        laboratorioId: r.lab !== undefined ? labs[r.lab].id : null,
        motivoRejeicao: r.motivo,
        cscProtocolo: r.protocolo,
        datas: {
          create: r.datas.map(([offset, horaInicio, horaFim]) => ({
            dia: diaDaSemana(offset), horaInicio, horaFim, emConflito: r.status === 'CONFLITO_DE_DATAS',
          })),
        },
      },
    })
    const hist: { evento: TipoEvento; usuarioId: string; antes?: StatusReserva; depois?: StatusReserva; obs?: string; meta?: object }[] = [
      { evento: 'CRIACAO', usuarioId: apoio.id, antes: 'CRIADA', depois: 'AGUARDANDO_CONFIRMACAO' },
    ]
    if (r.protocolo) {
      hist.push({ evento: 'ENVIO_CSC', usuarioId: operador.id, meta: { protocolo: r.protocolo } })
      hist.push({ evento: 'NOTIFICACAO_TEAMS', usuarioId: operador.id, obs: 'Notificação CRIACAO enviada ao Teams' })
    }
    if (r.status === 'CONFIRMADA') hist.push({ evento: 'CONFIRMACAO', usuarioId: operador.id, antes: 'AGUARDANDO_CONFIRMACAO', depois: 'CONFIRMADA' })
    if (r.status === 'REJEITADA') hist.push({ evento: 'REJEICAO', usuarioId: operador.id, antes: 'AGUARDANDO_CONFIRMACAO', depois: 'REJEITADA', obs: r.motivo })
    if (r.status === 'CONFLITO_DE_DATAS') hist.push({ evento: 'CONFLITO_DETECTADO', usuarioId: operador.id, antes: 'AGUARDANDO_CONFIRMACAO', depois: 'CONFLITO_DE_DATAS', obs: 'Sobreposição com reserva confirmada no Bloco A - Lab 101' })
    for (const [i, h] of hist.entries()) {
      await prisma.historicoTramitacao.create({
        data: {
          reservaId: reserva.id, usuarioId: h.usuarioId, evento: h.evento, statusAntes: h.antes, statusDepois: h.depois,
          observacao: h.obs, metadados: h.meta, criadoEm: new Date(Date.now() - (hist.length - i) * 60_000 * 37),
        },
      })
    }
    if (r.protocolo) {
      await prisma.logIntegracao.createMany({
        data: [
          { servico: 'CSC', endpoint: 'https://chamados.exemplo.com/api/abrir', metodo: 'POST', statusHttp: 200, payload: { reservaId: reserva.id }, resposta: { protocolo: r.protocolo } },
          { servico: 'TEAMS', endpoint: 'https://webhook.exemplo.com/teams', metodo: 'POST', statusHttp: 202, payload: { reservaId: reserva.id, evento: 'CRIACAO' } },
        ],
      })
    }
    criadas++
  }

  console.log(`✅ ${labs.length} laboratórios, ${profs.length} professores, ${turmas.length} turmas, ${criadas} reservas`)
  console.log('\nAcesso (senha de todos: Demo@1234):')
  console.log(`  ${admin.email}    → ADMINISTRADOR`)
  console.log(`  ${operador.email} → OPERADOR_TI`)
  console.log(`  ${apoio.email}    → APOIO_ACADEMICO`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
