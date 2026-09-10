import { redirect } from 'next/navigation'

// Redirect the root "/" to "/en"
export default function RootPage() {
  redirect('/en')
}
