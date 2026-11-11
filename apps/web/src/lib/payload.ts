import { getPayload } from 'payload'
import config from '@payload-config'

export const payloadClient = () => getPayload({ config })
