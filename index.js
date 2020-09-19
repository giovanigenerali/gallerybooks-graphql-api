const { ApolloServer, gql, PubSub } = require("apollo-server");
const DataLoader = require("dataloader");

const pubsub = new PubSub();
const BOOK_CHANGED_TOPIC = "BOOK_CHANGED_TOPIC";

const {
  getBooks,
  getBook,
  likeBook,
  getAuthors,
  getAuthor,
  getManyAuthors,
  getUserByToken,
} = require("./db");

const typeDefs = gql`
  type Book {
    id: Int!
    title: String!
    rating: Float!
    year: Int!
    image: String!
    likes: Int!
    authorId: Int!
    author: Author!
  }

  type Author {
    id: Int!
    name: String!
    imageUrl: String!
    about: String!
  }

  type Query {
    books: [Book]
    book(id: Int!): Book
    authors: [Author]
    author(id: Int!): Author
  }

  input LikeBook {
    id: Int!
  }

  type LikeBookResponse {
    success: Boolean!
  }

  type Mutation {
    likeBook(input: LikeBook!): LikeBookResponse
  }

  type Subscription {
    changedBook: Book!
  }
`;

const resolvers = {
  Book: {
    author: async (book, _, { loaders: { authors } }) =>
      await authors.load(book.authorId),
  },
  Query: {
    books: async () => await getBooks(),
    book: async (_, { id }) => await getBook(id),
    authors: async () => await getAuthors(),
    author: async (_, { id }) => await getAuthor(id),
  },
  Mutation: {
    likeBook: async (_, { input: { id } }) => {
      const success = await likeBook(id);

      if (success) {
        const book = await getBook(id);
        pubsub.publish("BOOK_CHANGED_TOPIC", { changedBook: book });
      }

      return { success };
    },
  },
  Subscription: {
    changedBook: {
      subscribe: () => pubsub.asyncIterator(BOOK_CHANGED_TOPIC),
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  subscriptions: {
    onConnect: async (connectionParams) => {
      const user = await getUserByToken(connectionParams.authToken);
      // console.log("subscriptions.authToken", user);

      return { user };
    },
  },
  context: async ({ req, connection }) => {
    const loaders = {
      authors: new DataLoader((keys) => getManyAuthors(keys)),
    };

    if (connection) {
      return { ...connection.context, loaders };
    }

    const user = await getUserByToken(req.headers.authorization);
    // console.log("req.authorization", user);

    return { loaders, user };
  },
  introspection: true,
  playground: true,
});

const port = process.env.PORT || 5000;

server.listen(port).then(({ url, subscriptionsUrl }) => {
  console.log(`🚀 Server ready at ${url}`);
  console.log(`🚀 Subscriptions ready at ${subscriptionsUrl}`);
});
