import { render } from '@testing-library/react'
import { test, expect } from 'vitest'
import { Card } from '../components/Card'

test('renders Card with title and content', () => {
  const { getByText } = render(<Card title="Hello">World</Card>)
  expect(getByText('Hello')).toBeInTheDocument()
  expect(getByText('World')).toBeInTheDocument()
})