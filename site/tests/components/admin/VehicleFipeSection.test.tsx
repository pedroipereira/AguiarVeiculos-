import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { VehicleFipeSection } from '@/components/admin/VehicleFipeSection'

describe('VehicleFipeSection', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url: string) => {
      if (url.includes('/marcas')) return new Response(JSON.stringify([{ code: '21', name: 'Fiat' }]), { status: 200 })
      if (url.includes('/modelos')) return new Response(JSON.stringify([{ code: '437', name: '147 C/ CL' }]), { status: 200 })
      if (url.includes('/anos')) return new Response(JSON.stringify([{ code: '1987-1', name: '1987 Gasolina' }]), { status: 200 })
      if (url.includes('/valor')) return new Response(JSON.stringify({ valueCents: 614700, fipeCode: '001124-0', referenceMonth: 'agosto de 2026' }), { status: 200 })
      throw new Error(`unexpected url ${url}`)
    }) as any
  })

  it('walks marca -> modelo -> ano and reports the fetched value via onSelect', async () => {
    const onSelect = vi.fn()
    render(<VehicleFipeSection onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: /buscar na fipe/i }))

    // Wait for each `<option>` to actually be in the DOM before firing change —
    // setting a <select>'s value to one with no matching <option> yet resets it
    // to "" instead (per the HTMLSelectElement spec), so firing too early would
    // silently make selectBrand("")/selectModel("") no-ops.
    await screen.findByRole('option', { name: 'Fiat' })
    fireEvent.change(screen.getByLabelText(/marca fipe/i), { target: { value: '21' } })
    await screen.findByRole('option', { name: '147 C/ CL' })
    fireEvent.change(screen.getByLabelText(/modelo fipe/i), { target: { value: '437' } })
    await screen.findByRole('option', { name: '1987 Gasolina' })
    fireEvent.change(screen.getByLabelText(/ano fipe/i), { target: { value: '1987-1' } })

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ brandCode: '21', modelCode: '437', yearCode: '1987-1', valueCents: 614700 }),
    ))
    expect(await screen.findByText(/último valor/i)).toBeInTheDocument()
  })

  it('shows the initial cached value without requiring a new lookup', () => {
    render(<VehicleFipeSection onSelect={vi.fn()} initialValueCents={500000} initialFetchedAt="2026-08-01T12:00:00.000Z" />)
    expect(screen.getByText(/último valor/i)).toBeInTheDocument()
  })

  it('shows an error message when the value lookup fails', async () => {
    global.fetch = vi.fn(async (url: string) => {
      if (url.includes('/marcas')) return new Response(JSON.stringify([{ code: '21', name: 'Fiat' }]), { status: 200 })
      if (url.includes('/modelos')) return new Response(JSON.stringify([{ code: '437', name: '147 C/ CL' }]), { status: 200 })
      if (url.includes('/anos')) return new Response(JSON.stringify([{ code: '1987-1', name: '1987 Gasolina' }]), { status: 200 })
      return new Response(JSON.stringify({ error: 'boom' }), { status: 502 })
    }) as any

    render(<VehicleFipeSection onSelect={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /buscar na fipe/i }))
    await screen.findByRole('option', { name: 'Fiat' })
    fireEvent.change(screen.getByLabelText(/marca fipe/i), { target: { value: '21' } })
    await screen.findByRole('option', { name: '147 C/ CL' })
    fireEvent.change(screen.getByLabelText(/modelo fipe/i), { target: { value: '437' } })
    await screen.findByRole('option', { name: '1987 Gasolina' })
    fireEvent.change(screen.getByLabelText(/ano fipe/i), { target: { value: '1987-1' } })

    expect(await screen.findByText(/não foi possível consultar/i)).toBeInTheDocument()
  })

  it('discards a stale /modelos response that resolves after a newer marca selection', async () => {
    // Regression test for a request-token race: select Fiat (slow /modelos response),
    // then reselect VW before Fiat's response arrives (fast /modelos response). The
    // stale Fiat response must not overwrite the VW models list once it finally lands.
    let resolveFiatModelos: (value: Response) => void = () => {}
    const fiatModelosPromise = new Promise<Response>((resolve) => { resolveFiatModelos = resolve })

    global.fetch = vi.fn(async (url: string) => {
      if (url.includes('/marcas')) {
        return new Response(
          JSON.stringify([{ code: '21', name: 'Fiat' }, { code: '30', name: 'VW' }]),
          { status: 200 },
        )
      }
      if (url.includes('/modelos') && url.includes('marca=21')) return fiatModelosPromise
      if (url.includes('/modelos') && url.includes('marca=30')) {
        return new Response(JSON.stringify([{ code: '999', name: 'Gol' }]), { status: 200 })
      }
      throw new Error(`unexpected url ${url}`)
    }) as any

    render(<VehicleFipeSection onSelect={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /buscar na fipe/i }))
    await screen.findByRole('option', { name: 'Fiat' })

    // Select Fiat first — kicks off the slow /modelos fetch that stays pending.
    fireEvent.change(screen.getByLabelText(/marca fipe/i), { target: { value: '21' } })
    // Before it resolves, reselect VW — kicks off a second, faster /modelos fetch.
    fireEvent.change(screen.getByLabelText(/marca fipe/i), { target: { value: '30' } })
    await screen.findByRole('option', { name: 'Gol' })

    // Now let the stale Fiat response resolve after the newer VW response already landed.
    await act(async () => {
      resolveFiatModelos(new Response(JSON.stringify([{ code: '437', name: '147 C/ CL' }]), { status: 200 }))
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(screen.queryByRole('option', { name: '147 C/ CL' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Gol' })).toBeInTheDocument()
  })
})
