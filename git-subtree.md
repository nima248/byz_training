Git subtree for byz-audio
-------------------------

Instructions from this tutorial: https://www.atlassian.com/git/tutorials/git-subtree

# Initial adding repo
git remote add -f byz-audio https://github.com/nima248/byz-audio.git
git subtree add --prefix lib/byz-audio byz-audio main --squash

# Updating
git fetch byz-audio main
git subtree pull --prefix lib/byz-audio byz-audio main --squash
