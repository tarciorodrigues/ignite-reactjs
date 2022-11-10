/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { format } from 'date-fns'
import { GetStaticPaths, GetStaticProps } from 'next'

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'
import { RichText } from 'prismic-dom'
import { useRouter } from 'next/router'
import Prismic from '@prismicio/client'
import { getPrismicClient } from '../../services/prismic'

import commonStyles from '../../styles/common.module.scss'
import styles from './post.module.scss'

interface Post {
  uid: string
  first_publication_date: string | null
  data: {
    title: string
    subtitle: string
    banner: {
      url: string
    }
    author: string
    content: {
      heading: string
      body: {
        text: string
      }[]
    }[]
  }
}

interface PostProps {
  post: Post
}

export default function Post({ post }: PostProps) {
  const router = useRouter()

  const readingTime = post.data.content.reduce((acc, element) => {
    const totalWords = RichText.asText(element.body).split(' ').length
    const time = Math.ceil(totalWords / 200)
    return acc + time
  }, 0)

  if (router.isFallback) {
    return <div>Carregando...</div>
  }
  return (
    <>
      <img className={styles.img} src={post.data.banner.url} alt="subject" />

      <main className={commonStyles.container}>
        <article>
          <h1>{post.data.title}</h1>
          <div className={styles.postData}>
            <time>
              <FiCalendar />
              {format(
                new Date(post.first_publication_date),
                'dd MMM yyyy'
              ).toLowerCase()}
            </time>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <span>
              <FiClock />
              {`${readingTime} min`}
            </span>
          </div>
          {post.data.content.map(element => {
            return (
              <div key={element.heading} className={styles.paragraph}>
                <h2>{element.heading}</h2>
                {element.body.map(paragraph => (
                  <p key={paragraph.text}>{paragraph.text}</p>
                ))}
              </div>
            )
          })}
        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient()
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.slug'],
      pageSize: 1,
    }
  )

  const paths = posts.results.map(result => ({
    params: { slug: result.uid },
  }))

  return {
    paths,
    fallback: true,
  }
}

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient()
  const { slug } = context.params
  const response = await prismic.getByUID('posts', String(slug), {})

  const post: Post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(object => {
        return {
          heading: object.heading,
          body: object.body.map(fragment => {
            return {
              spans: fragment.spans,
              text: fragment.text,
              type: fragment.type,
            }
          }),
        }
      }),
    },
  }

  return {
    props: {
      post,
    },
    redirect: 60 * 30, // 30 minutos
  }
}
