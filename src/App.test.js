import React from 'react'
import { render } from '@testing-library/react'
import App from './App'

test('renders the authentication entry point', () => {
  const { getByText } = render(<App />)
  const element = getByText(/sign in to play/i)
  expect(element).toBeInTheDocument()
})
