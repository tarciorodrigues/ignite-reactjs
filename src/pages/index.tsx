/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { GetStaticProps } from 'next'

import Prismic from '@prismicio/client'
import { format } from 'date-fns'
import { FiCalendar, FiUser } from 'react-icons/fi'
import Link from 'next/link'
import { useState } from 'react'
import { getPrismicClient } from '../services/prismic'

import commonStyles from '../styles/common.module.scss'
import styles from './home.module.scss'

interface Post {
  uid?: string
  first_publication_date: string | null
  data: {
    title: string
    subtitle: string
    author: string
  }
}

interface PostPagination {
  next_page: string
  results: Post[]
}

interface HomeProps {
  postsPagination?: PostPagination
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination.results)
  const [nextPage, setNextPage] = useState(postsPagination.next_page)

  const loadMorePosts = async () => {
    const newPosts = await fetch(`${nextPage}`).then(response =>
      response.json()
    )

    setNextPage(newPosts.next_page)
    setPosts([...posts, ...newPosts.results])
  }

  return (
    <>
      <main className={commonStyles.container}>
        {posts.map(result => (
          <div key={result.uid} className={styles.postPreview}>
            <Link href={`/post/${result.uid}`}>
              <a key={result.uid}>
                <h2>{result.data.title}</h2>
                <p>{result.data.subtitle}</p>
                <div>
                  <time>
                    <FiCalendar />
                    {format(
                      new Date(result.first_publication_date),
                      'dd MMM yyyy'
                    ).toLowerCase()}
                  </time>
                  <span>
                    <FiUser />
                    {result.data.author}
                  </span>
                </div>
              </a>
            </Link>
          </div>
        ))}
        {nextPage ? (
          <button
            className={styles.loadButton}
            type="button"
            onClick={() => loadMorePosts()}
          >
            Carregar mais posts
          </button>
        ) : null}
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient()

  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author', 'posts.slug'],
      pageSize: 1,
    }
  )

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results.map(result => {
      return {
        uid: result.uid,
        first_publication_date: result.first_publication_date,
        data: {
          title: result.data.title,
          subtitle: result.data.subtitle,
          author: result.data.author,
        },
      }
    }),
  }

  return {
    props: {
      postsPagination,
    },
  }
}
