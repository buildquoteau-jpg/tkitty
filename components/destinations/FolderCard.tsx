import Link from 'next/link'
import { getDestinationPhoto } from '@/lib/constants'
import type { DestinationFolder } from '@/types'

type Props = {
  folder: DestinationFolder
  groupId: string
}

export default function FolderCard({ folder, groupId }: Props) {
  const photo = folder.cover_image_url
    ? { url: folder.cover_image_url, credit: folder.cover_image_credit ?? '' }
    : getDestinationPhoto(folder.destination ?? folder.name)

  return (
    <Link
      href={`/groups/${groupId}/destinations/${folder.id}`}
      className="group block relative overflow-hidden rounded-2xl aspect-[4/3] bg-stone-100"
    >
      <img
        src={photo.url}
        alt={folder.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="photo-overlay" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5">
        <p className="font-serif text-xl text-white leading-snug">{folder.name}</p>
        {folder.target_date && (
          <p className="text-xs text-white/70 mt-1">{folder.target_date}</p>
        )}
        {typeof folder.itinerary_count === 'number' && (
          <p className="text-xs text-white/50 mt-1">
            {folder.itinerary_count} itiner{folder.itinerary_count === 1 ? 'y' : 'ies'}
          </p>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}
