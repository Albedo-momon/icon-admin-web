import { render, screen } from '@testing-library/react'
import { test, expect } from 'vitest'
import { Card } from '../components/Card'

test('renders Card with title and content', () => {
  render(<Card title="Hello">World</Card>)
  expect(screen.getByText('Hello')).toBeInTheDocument()
  expect(screen.getByText('World')).toBeInTheDocument()
})