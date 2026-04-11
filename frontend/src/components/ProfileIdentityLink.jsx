import { Link } from "react-router-dom";
import { buildProfilePath, getInitials, toAbsoluteAssetUrl } from "../utils/format";

const sizeStyles = {
  sm: {
    avatar: "h-10 w-10 rounded-2xl",
    title: "text-sm",
    subtitle: "text-xs"
  },
  md: {
    avatar: "h-12 w-12 rounded-2xl",
    title: "text-sm",
    subtitle: "text-xs"
  },
  lg: {
    avatar: "h-14 w-14 rounded-[1.25rem]",
    title: "text-base",
    subtitle: "text-sm"
  }
};

const ProfileIdentityLink = ({
  role,
  id,
  name,
  subtitle = "",
  avatarUrl = "",
  size = "md",
  showAvatar = true,
  showSubtitle = true,
  disableNavigation = false,
  className = "",
  nameClassName = "",
  subtitleClassName = "",
  onClick
}) => {
  const profilePath = buildProfilePath(role, id);
  const styles = sizeStyles[size] || sizeStyles.md;
  const content = (
    <>
      {showAvatar ? (
        avatarUrl ? (
          <img
            src={toAbsoluteAssetUrl(avatarUrl)}
            alt={name}
            className={`${styles.avatar} shrink-0 object-cover shadow-sm`}
          />
        ) : (
          <div
            className={`${styles.avatar} flex shrink-0 items-center justify-center bg-gradient-to-br from-sky-500 to-blue-700 font-display font-bold text-white shadow-sm`}
          >
            {getInitials(name || "JP")}
          </div>
        )
      ) : null}

      <span className="min-w-0">
        <span
          className={`block truncate font-semibold text-slate-950 transition group-hover:text-sky-700 dark:text-white dark:group-hover:text-sky-300 ${styles.title} ${nameClassName}`}
        >
          {name}
        </span>
        {showSubtitle && subtitle ? (
          <span
            className={`block truncate text-slate-500 dark:text-slate-400 ${styles.subtitle} ${subtitleClassName}`}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </>
  );

  const sharedClassName = `group inline-flex min-w-0 items-center gap-3 transition ${className}`;

  if (!profilePath || disableNavigation) {
    return <span className={sharedClassName}>{content}</span>;
  }

  return (
    <Link to={profilePath} className={sharedClassName} onClick={onClick}>
      {content}
    </Link>
  );
};

export default ProfileIdentityLink;
