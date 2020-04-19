import { useImmer } from 'use-immer'

export default () => {
    const [messages, setMessages] = useImmer([])
    

    return [messages, setMessages]
}