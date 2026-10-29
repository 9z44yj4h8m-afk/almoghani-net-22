import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props { channels?: { name: string; status: string }[]; checkedAt?: string }

function BrokenChannels({ channels = [], checkedAt }: Props) {
  return (
    <Html dir="rtl" lang="ar">
      <Head />
      <Preview>{`قنوات متعطلة: ${channels.length}`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ padding: '24px', maxWidth: '520px' }}>
          <Text style={{ color: '#6D28D9', fontWeight: 700, margin: 0 }}>ALMOGHANI LIVE</Text>
          <Heading style={{ color: '#090A18', fontSize: '22px' }}>تعطلت قنوات في موقعك</Heading>
          {channels.map((c, i) => (
            <Text key={i} style={{ color: '#333', margin: '4px 0' }}>• {c.name} — {c.status}</Text>
          ))}
          <Text style={{ color: '#777', fontSize: '12px' }}>وقت الفحص: {checkedAt || '-'}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BrokenChannels,
  subject: (d: Record<string, any>) => `تنبيه: ${(d['channels']?.length ?? 0)} قناة متعطلة`,
  displayName: 'تنبيه القنوات المتعطلة (للمالك)',
  to: 'a0552525337@gmail.com',
  previewData: { channels: [{ name: 'الوسام', status: 'لا يستجيب' }], checkedAt: '2026-10-29 17:00' },
} satisfies TemplateEntry
