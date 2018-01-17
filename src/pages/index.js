import React from 'react';
import Link from 'gatsby-link';
import get from 'lodash/get';
import sortBy from 'lodash/sortBy';
import Helmet from 'react-helmet';
import LazyLoad from 'react-lazyload';
import './index.scss';

import SitePost from '../components/SitePost';

/*
              <div className="dd-banner__greeting">
                <img
                  className="dd-banner__greeting__image"
                  src={pathPrefix + '/img/nerd.png'}
                />
                <h1 className="dd-banner__greeting__words">
                  Hi, I'm Rui Cheng
                </h1>
              </div>
              <div className="dd-banner__bio">
                I'm a coder, a self-certified solutions architect, a
                self-believing senior software engineer, an indoor sportsman,
                who knows a little bit of AWS, .NET, JavaScript, Devops and
                Microservices... I think I'm technical but I can't even use
                iPhone efficiently.
                <br />
                <br />
                <div>
                  I buy a lot games but never finish them. When I'm not coding,
                  I watch stupid shows on Netflix.
                </div>
              </div>
*/

function fixTableClass() {
  const tables = document.getElementsByTagName('table');
  const len = tables.length;
  for (let i = 0; i < len; i++) {
    if (!tables[i].classList.contains('table')) {
      tables[i].classList.add('table');
    }
  }
}

class BlogIndex extends React.Component {
  componentDidMount() {
    fixTableClass();
  }

  componentDidUpdate() {
    fixTableClass();
  }

  render() {
    const pathPrefix =
      process.env.NODE_ENV === 'development' ? '' : __PATH_PREFIX__;

    let pageLinks = [];
    const site = get(this, 'props.data.site.siteMetadata');
    const posts = get(this, 'props.data.remark.posts');

    const sortedPosts = sortBy(posts, post => {
      // if (get(post, 'post.frontmatter.top')) {
      //   return '2020-01-02T19:00:33.192Z';
      // }
      return get(post, 'post.frontmatter.date');
    }).reverse();

    let topMostPreview = null;
    sortedPosts.forEach((data, i) => {
      const layout = get(data, 'post.frontmatter.layout');
      const isDraft = get(data, 'post.frontmatter.draft');
      const path = get(data, 'post.path');
      // const top = get(data, 'post.frontmatter.top');
      if (layout === 'post' && path !== '/404/' && !isDraft) {
        const preview = (
          <LazyLoad height={500} offset={500} once={true} key={i}>
            <SitePost data={data.post} site={site} isIndex={true} key={i} />
          </LazyLoad>
        );
        pageLinks.push(preview);
      }
    });

    // pageLinks = [topMostPreview].concat(pageLinks);

    return (
      <div>
        <Helmet
          title={get(site, 'title')}
          meta={[
            { property: 'og:title', content: get(site, 'title') },
            { property: 'og:type', content: 'website' },
            { property: 'og:description', content: get(site, 'description') },
            { property: 'og:url', content: get(site, 'url') },
          ]}
        />
        <div className="dd-banner">
          <div className="container">
            <div className="col-md-12">
              <div className="dd-banner__bio">
                Welcome. I write things about AWS, .NET, JavaScript, DevOps and
                Microservices...
              </div>
            </div>
          </div>
        </div>
        {pageLinks}
      </div>
    );
  }
}

export default BlogIndex;

export const pageQuery = graphql`
  query IndexQuery {
    site {
      siteMetadata {
        title
        description
        url: siteUrl
        author
        adsense
      }
    }
    remark: allMarkdownRemark {
      posts: edges {
        post: node {
          html
          frontmatter {
            layout
            title
            path
            categories
            date(formatString: "YYYY/MM/DD")
          }
        }
      }
    }
  }
`;
