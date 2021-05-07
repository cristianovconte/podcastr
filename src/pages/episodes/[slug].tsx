import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router'
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { api } from '../../services/api';
import { convertDurationToTimeString } from '../../utils/convertDurationToTimeString';
import Image from 'next/image';
import Link from 'next/link';
import styles from './episode.module.scss';

/* IMPORTANTE- Legal sempre deixarmos os types o mais próximo possível das páginas, pois são o que serão exibidos, não reaproveitar a estrutura */
type Episode = {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  members: string;
  duration: number;
  durationAsString: string,
  url: string;
  publishedAt: string;
}

type EpisodeProps = {
  episode: Episode;
}

export default function Episode({ episode } : EpisodeProps) {
  const router = useRouter();

  /* Devemos utilizar essa condição somente quando a página for renderizada no browser
  if(router.isFallback){
    return <p>Carregando...</p>
  }
 */

  return(
    <div className={styles.episode}>
      <div className={styles.thumbnailContainer}>
        <Link href='/'>
          <button>
            <img src="/arrow-left.svg" alt="Voltar"/>
          </button>
        </Link>
        <Image 
          width={700}
          height={160}
          src={episode.thumbnail}
          alt={episode.title}
          objectFit="cover"
        />
        <button>
          <img src="/play.svg" alt="Tocar episódio"/>
        </button>
      </div>
      <header>
        <h1>{episode.title}</h1>
        <span>{episode.members}</span>
        <span>{episode.publishedAt}</span>
        <span>{episode.durationAsString}</span>
      </header>

      <div 
        className={styles.description} 
        dangerouslySetInnerHTML={{__html: episode.description}}
      />
    </div>

  )
}

/* Obrigatório o uso quando a página está usando GetStaticProps e utilizando parâmetros */
export const getStaticPaths: GetStaticPaths = async () => {

  const { data } = await api.get('episodes',
  {
    params: {
      _limit: 2,
      _sort: 'published_at',
      _order: 'desc'
    }
  })

  const paths = data.map(episode => {
    return {
      params: { 
        slug: episode.id
      }
    }
  })

  return {
    paths,
    /*
    false -> Carrega somente as páginas estáticas informadas no "paths" diferente disso retorna 404
    Incremental static generation
    true -> Carrega as páginas no browser (client)
    'blocking' -> Carrega as páginas no servidor (next.js) node-js e exibe as páginas no browser somente quando tiver pronta (SEO)
    */
    fallback: 'blocking'
  }
}

/* Páginas estáticas só funcionam compilados pois são geradas no momento da build */
export const getStaticProps: GetStaticProps = async (ctx) => {
  const { slug } = ctx.params;

  const { data } = await api.get(`/episodes/${slug}`);

  const episode = {
    id: data.id,
    title: data.title,
    thumbnail: data.thumbnail,
    members: data.members,
    publishedAt: format(parseISO(data.published_at), 'd MMM yy', {locale: ptBR}),
    duration: Number(data.file.duration),
    durationAsString: convertDurationToTimeString(Number(data.file.duration)),
    description: data.description,
    url: data.file.url,  
  }

  return { 
    props: { episode },
    revalidate: 60 * 60 * 24, // 24 hours
  }
}