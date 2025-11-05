'use client';

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { NewsItem } from "@/types/news"

// Helper to format category names
const formatCategory = (category: string) => {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export const columns: ColumnDef<NewsItem>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.original.category
      return (
        <Badge variant="outline" className="capitalize">
          {formatCategory(category)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={status === 'published' ? 'default' : 'secondary'}>
          {status.toUpperCase()}
        </Badge>
      )
    },
  },
  {
    accessorKey: "published_at",
    header: "Published",
    cell: ({ row }) => {
      const date = new Date(row.original.published_at)
      return date.toLocaleDateString()
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const news = row.original
      const isPublished = news.status === 'published'

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {isPublished ? (
              <DropdownMenuItem
                onClick={() => console.log('Unpublish', news.id)}
                className="text-destructive"
              >
                Unpublish
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => console.log('Publish', news.id)}
                className="text-green-600"
              >
                Publish
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => console.log('Edit', news.id)}
              disabled // TODO: Implement edit functionality
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log('Delete', news.id)}
              className="text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
