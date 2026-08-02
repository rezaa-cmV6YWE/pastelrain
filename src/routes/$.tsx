import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  component: NotFound,
})

function NotFound() {
  return <Navigate to="/" replace />
}
