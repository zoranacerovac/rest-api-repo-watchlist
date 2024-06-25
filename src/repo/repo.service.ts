import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RepoDto } from './dto/repo.dto';
import { Repo } from './repo.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Watchlist } from 'src/user/entites/watchlist.entity';
import { Release } from 'src/user/entites/release.entity';

@Injectable()
export class RepoService implements OnModuleInit {
  private octokit: any;
  private lastChecked: Date = new Date();

  constructor(
    @InjectRepository(Repo)
    private readonly repoRepository: Repository<Repo>,
    @InjectRepository(Watchlist)
    private readonly watchlistRepository: Repository<Watchlist>,
    @InjectRepository(Watchlist)
    private readonly releaseRepository: Repository<Release>,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    const { Octokit } = await import('@octokit/rest');
    this.octokit = new Octokit({
      auth: this.config.get('GITHUB_TOKEN'),
    });
  }

  async searchRepositories(query: string) {
    try {
      const response = await this.octokit.search.repos({
        q: query,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      return response.data.items.map((repo) => ({
        repositoryName: repo.name,
        authorName: repo.owner.login,
        repositoryUrls: repo.html_url,
        releasesUrl: repo.releases_url,
        subscriptionUrl: repo.subscription_url,
      }));
    } catch (error) {
      if (error.status === 401) {
        console.error('Bad credentials:', error.message);

        throw new HttpException(
          'Bad credentials: Invalid GitHub token',
          HttpStatus.UNAUTHORIZED,
        );
      } else {
        console.error('Failed to search repositories:', error.message);

        throw new HttpException(
          `Failed to search repositories: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  //List all repositories
  async getMyWatchlist(userID: number) {
    const watchlistEntries = await this.watchlistRepository.find({
      where: { userID: userID },
    });

    // Extract repoIDs
    const repoIDs = watchlistEntries.map((entry) => entry.repoID);

    // Find all repositories
    const repos = await this.repoRepository.findByIds(repoIDs);

    const watchlistRepos = repos.map((repo) => ({
      repositoryName: repo.repositoryName,
      authorName: repo.authorName,
      repositoryUrls: repo.repositoryUrls,
      releasesUrl: repo.releasesUrl,
      subscriptionUrl: repo.subscriptionUrl,
    }));

    return watchlistRepos;
  }

  //Subscribe to repository
  async addSubscription(dto: RepoDto, userID: number) {
    const existingRepo = await this.repoRepository.findOne({
      where: { repositoryUrls: dto.repositoryUrls },
    });
    let savedRepo: Repo;

    if (existingRepo) {
      savedRepo = existingRepo;
    } else {
      // Create a new repo
      const repo = new Repo();
      repo.authorName = dto.authorName;
      repo.releasesUrl = dto.releasesUrl;
      repo.repositoryName = dto.repositoryName;
      repo.subscriptionUrl = dto.subscriptionUrl;
      repo.repositoryUrls = dto.repositoryUrls;

      // Save the new repo
      savedRepo = await this.repoRepository.save(repo);
    }
    // Check if userID and repoID already exists in the watchlist
    const existingWatchlist = await this.watchlistRepository.findOne({
      where: { userID: userID, repoID: savedRepo.id },
    });

    if (existingWatchlist) {
      return 'You are already subscribed to this repository.';
    }

    // Add to watchlist
    const watchlist = new Watchlist();
    watchlist.userID = userID;
    watchlist.repoID = savedRepo.id;
    await this.watchlistRepository.save(watchlist);

    return 'Successfully subscribed!';
  }

  //Remove subscripton from repository
  async removeSubscription(dto: RepoDto, userID: number) {
    // Find the repository in the database
    const repo = await this.repoRepository.findOne({
      where: { repositoryUrls: dto.repositoryUrls },
    });

    if (!repo) {
      return 'The repository does not exist in the database.';
    }

    // Delete the repository
    const deleteWatchlistResult = await this.watchlistRepository.delete({
      userID: userID,
      repoID: repo.id,
    });

    if (deleteWatchlistResult.affected === 0) {
      return 'No subscription found for the given user and repository.';
    }

    // Check if there are any other with the same repoID
    const remainingWatchlistEntries = await this.watchlistRepository.find({
      where: { repoID: repo.id },
    });

    if (remainingWatchlistEntries.length === 0) {
      // Delete the repository from the repo table
      await this.repoRepository.delete(repo.id);
      return 'The subscription and repository were deleted successfully.';
    }

    return 'The subscription was deleted successfully.';
  }

  //@Cron('* * * * *') // Every min
  @Cron('*/15 * * * *') // Every 15 minutes
  async checkForNewReleases() {
    const repos = await this.repoRepository.find();
    for (const repo of repos) {
      try {
        const response = await this.octokit.repos.listReleases({
          owner: repo.authorName,
          repo: repo.repositoryName,
        });

        if (response.data.length === 0) {
          console.log(
            `No releases found for the repository ${repo.repositoryName}.`,
          );
          continue;
        }

        const latestRelease = response.data[0];
        if (new Date(latestRelease.published_at) > this.lastChecked) {
          console.log('New release detected:', latestRelease);
          //await this.notifyUsers(repo.id, latestRelease);
        }
      } catch (error) {
        console.error('Failed to check for new releases:', error.message);
      }
    }
    this.lastChecked = new Date();
  }

  // private async notifyUsers(repoID: number, release: any) {
  //   const users = await this.releaseRepository.find({ where: { repoID } });
  //   for (const user of users) {
  //     //this.sendEmail(user.userID, release);
  //   }
  // }

  private sendEmail(userID: number, release: any) {
    // Implement email sending logic here
    console.log(`Sending email to user ${userID} about new release:`, release);
  }

  @Cron('*/15 * 1 * *')
  async monthyCheck() {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const repos = await this.repoRepository.find();
    for (const repo of repos) {
      try {
        const response = await this.octokit.repos.listReleases({
          owner: repo.authorName,
          repo: repo.repositoryName,
        });

        const monthlyReleases = response.data.filter((release) => {
          const releaseDate = new Date(release.published_at);
          return (
            releaseDate > lastMonth &&
            releaseDate.getFullYear() === new Date().getFullYear()
          );
        });

        if (monthlyReleases.length > 0) {
          // await this.notifyUsersMonthly(repo.id, monthlyReleases);
        }
      } catch (error) {
        console.error('Failed to check for monthly releases:', error.message);
      }
    }
  }

  // private async notifyUsersMonthly(repoID: number, releases: any[]) {
  //   const users = await this.releaseRepository.find({ where: { repoID } });
  //   for (const user of users) {
  //     const userEmail = await this.getUserEmail(user.userID);
  //     const releaseDetails = releases
  //       .map((release) => release.html_url)
  //       .join('\n');
  //     await this.emailService.sendMail(
  //       userEmail,
  //       'Monthly Release Summary',
  //       `Here are the releases for the past month:\n${releaseDetails}`,
  //     );
  //   }
  //}

  //GIT HUB WATCH...
  async subscribeToRepo(owner: string, repo: string) {
    try {
      const response = await this.octokit.activity.setRepoSubscription({
        owner,
        repo,
        subscribed: true,
        ignored: false,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to subscribe to repository:', error.message);
      throw new HttpException(
        `Failed to subscribe to repository: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async unsubscribeFromRepo(owner: string, repo: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await this.octokit.activity.deleteRepoSubscription({
        owner,
        repo,
      });
      return { message: 'Successfully unsubscribed from repository' };
    } catch (error) {
      console.error('Failed to unsubscribe from repository:', error.message);
      throw new HttpException(
        `Failed to unsubscribe from repository: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
