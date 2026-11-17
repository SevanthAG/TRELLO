import { Spinner } from './ui/spinner'

const Loader = () => {
  return (
    <div className='flex min-h-screen w-full items-center justify-center'>
      <Spinner className='size-14' />
    </div>
  )
}

export default Loader
