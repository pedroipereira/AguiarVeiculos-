import { render, screen } from '@testing-library/react'
import { QuinzeAnos } from '@/components/home/QuinzeAnos'

describe('QuinzeAnos', () => {
  it('tells the 15-year story and names Antonio Aguiar', () => {
    render(<QuinzeAnos />)
    expect(screen.getByText(/antonio aguiar/i)).toBeInTheDocument()
    expect(screen.getByText(/15 anos realizando/i)).toBeInTheDocument()
  })
})
