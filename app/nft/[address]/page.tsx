import { redirect } from 'next/navigation'

export default function LegacyNftRoute({ params }: { params: { address: string } }) {
  redirect(`/registry/${params.address}`)
}
