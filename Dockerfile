FROM ruby:3.3

WORKDIR /site

# Install gems first so they are cached between builds
COPY Gemfile ./
RUN bundle install

COPY . .

EXPOSE 4000 35729

CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--livereload", "--force_polling"]
