import { Avatar, Button, Card, CardFooter, CardHeader, Chip } from '@heroui/react'
import { calcTraffic } from '@renderer/utils/calc'
import dayjs from 'dayjs'
import React, { memo, useEffect, useState } from 'react'
import { CgClose, CgTrash } from 'react-icons/cg'

// 判断是否为IP地址（IPv4或IPv6）
const isIPAddress = (host: string): boolean => {
  // IPv4 正则
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

  // IPv6 正则（简化版，覆盖常见格式）
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/

  return ipv4Regex.test(host) || ipv6Regex.test(host)
}

// 从域名中提取根域名
const extractRootDomain = (host: string): string | null => {
  if (isIPAddress(host)) {
    return null
  }

  // 移除端口号
  const domain = host.split(':')[0]

  // 简单的域名验证
  if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
    return null
  }

  // 提取根域名（处理子域名）
  const parts = domain.split('.')
  if (parts.length >= 2) {
    // 取最后两部分作为根域名（如 bilibili.com）
    return parts.slice(-2).join('.')
  }

  return null
}

// 域名图标组件
const DomainIcon: React.FC<{ host: string }> = ({ host }) => {
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const rootDomain = extractRootDomain(host)
    if (!rootDomain) {
      setIsLoading(false)
      return
    }

    const faviconUrl = `https://${rootDomain}/favicon.ico`

    // 预加载图标以检查是否存在
    const img = new Image()
    img.onload = () => {
      setIconUrl(faviconUrl)
      setIsLoading(false)
    }
    img.onerror = () => {
      setIconUrl(null)
      setIsLoading(false)
    }
    img.src = faviconUrl
  }, [host])

  if (isLoading || !iconUrl) {
    return null
  }

  return (
    <img
      src={iconUrl}
      alt="Domain icon"
      className="inline-block w-4 h-4 mr-1 align-text-bottom"
      style={{ objectFit: 'contain' }}
    />
  )
}

interface Props {
  index: number
  info: IMihomoConnectionDetail
  displayIcon?: boolean
  iconUrl: string
  selected: IMihomoConnectionDetail | undefined
  setSelected: React.Dispatch<React.SetStateAction<IMihomoConnectionDetail | undefined>>
  setIsDetailModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  close: (id: string) => void
}

const ConnectionItemComponent: React.FC<Props> = (props) => {
  const { index, info, displayIcon, iconUrl, close, selected, setSelected, setIsDetailModalOpen } =
    props

  useEffect(() => {
    if (selected?.id === info.id) {
      setSelected(info)
    }
  }, [info])

  return (
    <div className={`px-2 pb-2 ${index === 0 ? 'pt-2' : ''}`} style={{ minHeight: 80 }}>
      <Card
        isPressable
        className="w-full"
        onPress={() => {
          setSelected(info)
          setIsDetailModalOpen(true)
        }}
      >
        <div className="w-full flex justify-between items-center">
          {displayIcon && (
            <div>
              <Avatar size="lg" radius="sm" src={iconUrl} className="bg-transparent ml-2" />
            </div>
          )}
          <div
            className={`w-full flex flex-col justify-start truncate relative ${displayIcon ? '-ml-2' : ''}`}
          >
            <CardHeader className="pb-0 gap-1 flex items-center pr-12 relative">
              <div className="ml-2 flex-1 text-ellipsis whitespace-nowrap overflow-hidden text-left">
                <span style={{ textAlign: 'left' }}>
                  {info.metadata.process?.replace(/\.exe$/, '') || info.metadata.sourceIP}
                </span>
                {' → '}
                <span>
                  <DomainIcon host={info.metadata.host || info.metadata.sniffHost || ''} />
                  {info.metadata.host ||
                    info.metadata.sniffHost ||
                    info.metadata.destinationIP ||
                    info.metadata.remoteDestination}
                </span>
              </div>
              <small className="ml-2 whitespace-nowrap text-foreground-500">
                {dayjs(info.start).fromNow()}
              </small>
              <Button
                color={info.isActive ? 'warning' : 'danger'}
                variant="light"
                isIconOnly
                size="sm"
                className="absolute right-2 transform"
                onPress={() => {
                  close(info.id)
                }}
              >
                {info.isActive ? <CgClose className="text-lg" /> : <CgTrash className="text-lg" />}
              </Button>
            </CardHeader>
            <CardFooter className="pt-2">
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                <Chip
                  color={info.isActive ? 'primary' : 'danger'}
                  size="sm"
                  radius="sm"
                  variant="dot"
                >
                  {info.metadata.type}({info.metadata.network.toUpperCase()})
                </Chip>
                <Chip
                  className="flag-emoji whitespace-nowrap overflow-hidden"
                  size="sm"
                  radius="sm"
                  variant="bordered"
                >
                  {info.chains[0]}
                </Chip>
                <Chip size="sm" radius="sm" variant="bordered">
                  ↑ {calcTraffic(info.upload)} ↓ {calcTraffic(info.download)}
                </Chip>
                {info.uploadSpeed || info.downloadSpeed ? (
                  <Chip color="primary" size="sm" radius="sm" variant="bordered">
                    ↑ {calcTraffic(info.uploadSpeed || 0)}/s ↓{' '}
                    {calcTraffic(info.downloadSpeed || 0)}
                    /s
                  </Chip>
                ) : null}
              </div>
            </CardFooter>
          </div>
        </div>
      </Card>
    </div>
  )
}

const ConnectionItem = memo(ConnectionItemComponent)

export default ConnectionItem
